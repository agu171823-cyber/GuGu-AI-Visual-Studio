import { describe, expect, it, vi } from "vitest";
import {
  create147Provider,
  describeUpstreamError,
  normalizeApiKey,
  normalizeBaseUrl,
} from "../server/providers/147";
import { ProviderError, type EditImageInput } from "../server/providers/provider";

function makeProviderInput(imageCount = 2): EditImageInput {
  return {
    apiKey: "sk-test",
    baseUrl: "https://147ai.com/v1",
    model: "gpt-image-2",
    prompt: "成年人授权肖像测试",
    size: "1024x1536",
    quality: "medium",
    images: Array.from({ length: imageCount }, (_, index) =>
      new File([`portrait-${index}`], `portrait-${index}.png`, { type: "image/png" }),
    ),
  };
}

describe("147 provider", () => {
  it("normalizes harmless key artifacts and blocks duplicated prefixes", () => {
    expect(normalizeApiKey(" Bearer sk-demo ")).toBe("sk-demo");
    expect(normalizeApiKey("'sk-demo'")).toBe("sk-demo");
    expect(() => normalizeApiKey("sk-sk-demo")).toThrow(/重复/);
  });

  it("allows only HTTPS 147 hosts", () => {
    expect(normalizeBaseUrl("https://api.147ai.cn/v1/")).toBe("https://api.147ai.cn/v1");
    expect(() => normalizeBaseUrl("http://147ai.com/v1")).toThrow(/HTTPS/);
    expect(() => normalizeBaseUrl("https://evil.example/v1")).toThrow(/147ai/);
  });

  it("sends repeated image fields through a real multipart edit request", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe("https://147ai.com/v1/images/edits");
      expect(init?.method).toBe("POST");
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer sk-test");
      const form = init?.body as FormData;
      expect(form.getAll("image")).toHaveLength(2);
      expect((form.getAll("image") as File[]).map((image) => image.name)).toEqual([
        "reference-1.png",
        "reference-2.png",
      ]);
      expect(form.get("model")).toBe("gpt-image-2");
      expect(form.get("input_fidelity")).toBe("high");
      expect(form.get("size")).toBe("1024x1536");
      return Response.json({ data: [{ b64_json: "ZmFrZQ==" }] });
    });
    const provider = create147Provider(fetchMock as typeof fetch);

    const result = await provider.editImage(makeProviderInput());

    expect(result.imageB64).toBe("ZmFrZQ==");
    expect(result.provider).toBe("147");
  });

  it("checks models without starting an image request", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      Response.json({ data: [{ id: "gpt-image-2" }, { id: "another-model" }] }),
    );
    const provider = create147Provider(fetchMock as typeof fetch);

    const result = await provider.validateKey({
      apiKey: "sk-test",
      baseUrl: "https://147ai.com/v1",
      model: "gpt-image-2",
    });

    expect(result).toEqual({ valid: true, modelAvailable: true });
    expect(String(fetchMock.mock.calls[0][0])).toContain("/models");
  });

  it("maps upstream failures without exposing raw secrets", async () => {
    const provider = create147Provider(
      vi.fn(async () => Response.json({ error: { message: "Invalid token sk-secret" } }, { status: 401 })) as typeof fetch,
    );

    await expect(provider.editImage(makeProviderInput(1))).rejects.toMatchObject({
      status: 401,
      message: expect.stringMatching(/API Key/),
    });
    await expect(provider.editImage(makeProviderInput(1))).rejects.not.toThrow(/sk-secret/);
    expect(describeUpstreamError(400, "moderation_blocked")).toMatch(/审核/);
    expect(new ProviderError(400, "safe")).toBeInstanceOf(Error);
  });

  it("reports moderation diagnostics without guessing the blocked layer", async () => {
    const provider = create147Provider(
      vi.fn(async () => Response.json(
        { error: { message: "raw secret sk-secret", code: "moderation_blocked", type: "image_error" } },
        { status: 400, headers: { "x-request-id": "req-safe_1234" } },
      )) as typeof fetch,
    );

    const error = await provider.editImage(makeProviderInput(1)).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ProviderError);
    expect((error as Error).message).toMatch(/内容审核/);
    expect((error as Error).message).toMatch(/未说明具体拦截层/);
    expect((error as Error).message).toMatch(/req-safe_1234/);
    expect((error as Error).message).not.toMatch(/sk-secret|image_error/);
  });

  it("omits unsafe upstream request identifiers", async () => {
    const unsafeRequestId = `req-${"x".repeat(100)}`;
    const provider = create147Provider(
      vi.fn(async () => Response.json(
        { error: { code: "content_policy_violation" } },
        { status: 400, headers: { "request-id": unsafeRequestId } },
      )) as typeof fetch,
    );

    const error = await provider.editImage(makeProviderInput(1)).catch((reason: unknown) => reason);

    expect((error as Error).message).toMatch(/内容审核/);
    expect((error as Error).message).not.toContain(unsafeRequestId);
  });
});
