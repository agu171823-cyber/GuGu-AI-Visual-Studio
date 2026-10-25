from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents
from pypdf import PdfReader, PdfWriter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "GuGu-AI-Visual-Studio-0.1.0-LAN-Deployment-Guide-CN.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

FONT_REGULAR = Path(r"C:\Windows\Fonts\msyh.ttc")
FONT_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
if not FONT_REGULAR.exists():
    FONT_REGULAR = Path(r"C:\Windows\Fonts\simhei.ttf")
if not FONT_BOLD.exists():
    FONT_BOLD = FONT_REGULAR

pdfmetrics.registerFont(TTFont("CN", str(FONT_REGULAR)))
pdfmetrics.registerFont(TTFont("CN-Bold", str(FONT_BOLD)))

PAGE_W, PAGE_H = A4
NAVY = colors.HexColor("#101827")
PANEL = colors.HexColor("#182235")
PURPLE = colors.HexColor("#7C5CFC")
CYAN = colors.HexColor("#43D9D3")
GREEN = colors.HexColor("#2DCB82")
AMBER = colors.HexColor("#F0B64D")
RED = colors.HexColor("#EE6B73")
INK = colors.HexColor("#172033")
MUTED = colors.HexColor("#5F6B7A")
LIGHT = colors.HexColor("#F4F6FA")
LINE = colors.HexColor("#DDE3EC")
WHITE = colors.white


class ManualDocTemplate(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=20 * mm,
            bottomMargin=18 * mm,
            title="GuGu AI Visual Studio 0.1.0 局域网部署保姆级手册",
            author="GuGu AI Visual Studio",
            subject="公司局域网团队版部署、使用、备份与排障",
        )
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="normal",
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )
        self.addPageTemplates(PageTemplate(id="content", frames=[frame], onPage=draw_page))

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            level = getattr(flowable, "toc_level", None)
            if level is not None:
                text = flowable.getPlainText()
                key = f"section-{self.seq.nextf('section')}"
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level=level, closed=False)
                self.notify("TOCEntry", (level, text, self.page, key))


def draw_page(canvas, doc):
    canvas.saveState()
    if doc.page == 1:
        canvas.setFillColor(NAVY)
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    else:
        canvas.setFillColor(colors.HexColor("#FBFCFE"))
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        canvas.setStrokeColor(LINE)
        canvas.line(18 * mm, PAGE_H - 13 * mm, PAGE_W - 18 * mm, PAGE_H - 13 * mm)
        canvas.setFont("CN", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(18 * mm, PAGE_H - 10 * mm, "GuGu AI Visual Studio 0.1.0 · 局域网团队版部署手册")
        canvas.drawRightString(PAGE_W - 18 * mm, 10 * mm, f"第 {doc.page} 页")
    canvas.restoreState()


base = getSampleStyleSheet()
styles = {
    "cover_kicker": ParagraphStyle(
        "cover_kicker", fontName="CN-Bold", fontSize=11, leading=16,
        textColor=CYAN, spaceAfter=12, alignment=TA_LEFT,
    ),
    "cover_title": ParagraphStyle(
        "cover_title", fontName="CN-Bold", fontSize=29, leading=40,
        textColor=WHITE, spaceAfter=12,
    ),
    "cover_subtitle": ParagraphStyle(
        "cover_subtitle", fontName="CN", fontSize=13, leading=22,
        textColor=colors.HexColor("#C7D1E3"), spaceAfter=18,
    ),
    "cover_value": ParagraphStyle(
        "cover_value", fontName="CN", fontSize=8.8, leading=14,
        textColor=colors.HexColor("#DCE5F5"),
    ),
    "h1": ParagraphStyle(
        "h1", fontName="CN-Bold", fontSize=21, leading=29,
        textColor=INK, spaceBefore=4, spaceAfter=12, keepWithNext=True,
    ),
    "h2": ParagraphStyle(
        "h2", fontName="CN-Bold", fontSize=14, leading=21,
        textColor=colors.HexColor("#4D3AC7"), spaceBefore=12, spaceAfter=7, keepWithNext=True,
    ),
    "h3": ParagraphStyle(
        "h3", fontName="CN-Bold", fontSize=11.5, leading=18,
        textColor=INK, spaceBefore=8, spaceAfter=4, keepWithNext=True,
    ),
    "body": ParagraphStyle(
        "body", fontName="CN", fontSize=9.5, leading=16,
        textColor=INK, spaceAfter=6,
    ),
    "small": ParagraphStyle(
        "small", fontName="CN", fontSize=8.2, leading=13,
        textColor=MUTED, spaceAfter=4,
    ),
    "bullet": ParagraphStyle(
        "bullet", fontName="CN", fontSize=9.3, leading=15.5,
        textColor=INK, leftIndent=11, firstLineIndent=-8, spaceAfter=4,
    ),
    "step_title": ParagraphStyle(
        "step_title", fontName="CN-Bold", fontSize=11.5, leading=18,
        textColor=INK, spaceAfter=3,
    ),
    "step_body": ParagraphStyle(
        "step_body", fontName="CN", fontSize=9.2, leading=15,
        textColor=INK,
    ),
    "callout": ParagraphStyle(
        "callout", fontName="CN", fontSize=9.2, leading=15.5,
        textColor=INK,
    ),
    "code": ParagraphStyle(
        "code", fontName="CN", fontSize=8.2, leading=13,
        textColor=colors.HexColor("#E8EEFF"), leftIndent=0,
    ),
    "table_head": ParagraphStyle(
        "table_head", fontName="CN-Bold", fontSize=8.6, leading=13,
        textColor=WHITE,
    ),
    "table_cell": ParagraphStyle(
        "table_cell", fontName="CN", fontSize=8.2, leading=13,
        textColor=INK,
    ),
    "toc": ParagraphStyle(
        "toc", fontName="CN", fontSize=10, leading=17,
        textColor=INK, leftIndent=8, firstLineIndent=-8,
    ),
}


def P(text, style="body"):
    return Paragraph(text, styles[style])


def H1(title):
    p = P(title, "h1")
    p.toc_level = 0
    return p


def H2(title):
    return P(title, "h2")


def bullets(items):
    return [P(f"<font color='#7C5CFC'>●</font>&nbsp;&nbsp;{item}", "bullet") for item in items]


def step(number, title, text):
    badge = Table(
        [[P(str(number), "step_title")]],
        colWidths=[10 * mm], rowHeights=[10 * mm],
    )
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PURPLE),
        ("TEXTCOLOR", (0, 0), (-1, -1), WHITE),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    content = [P(title, "step_title"), P(text, "step_body")]
    table = Table([[badge, content]], colWidths=[13 * mm, 150 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (0, -1), 3 * mm),
        ("RIGHTPADDING", (1, 0), (1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


def callout(title, text, tone="info"):
    palette = {
        "info": (colors.HexColor("#EDE9FF"), PURPLE),
        "ok": (colors.HexColor("#E5F8EF"), GREEN),
        "warn": (colors.HexColor("#FFF4DC"), AMBER),
        "danger": (colors.HexColor("#FDEBED"), RED),
    }
    bg, accent = palette[tone]
    table = Table([[P(f"<b>{title}</b><br/>{text}", "callout")]], colWidths=[164 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.6, accent),
        ("LINEBEFORE", (0, 0), (0, -1), 4, accent),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return KeepTogether([table, Spacer(1, 4 * mm)])


def code_block(lines):
    content = "<br/>".join(line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") for line in lines)
    table = Table([[P(content, "code")]], colWidths=[164 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#283653")),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return KeepTogether([table, Spacer(1, 4 * mm)])


def data_table(headers, rows, widths):
    data = [[P(str(value), "table_head") for value in headers]]
    for row in rows:
        data.append([P(str(value), "table_cell") for value in row])
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PANEL),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
    ]))
    return table


def architecture_diagram():
    boxes = [
        ("同事电脑 A", "浏览器访问"),
        ("同事电脑 B", "浏览器访问"),
        ("服务器电脑", "GuGu 服务 + 团队数据"),
        ("图片供应商", "147 图片 / 火山方舟"),
    ]
    cells = []
    for title, subtitle in boxes:
        cells.append([P(f"<b>{title}</b><br/><font color='#5F6B7A'>{subtitle}</font>", "body")])
    top = Table([[cells[0], cells[1]]], colWidths=[77 * mm, 77 * mm])
    top.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EDF5FF")),
        ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#7AA7DD")),
        ("INNERGRID", (0, 0), (-1, -1), 0.7, WHITE),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    server = Table([[cells[2]]], colWidths=[154 * mm])
    server.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EDE9FF")),
        ("BOX", (0, 0), (-1, -1), 1.2, PURPLE),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    provider = Table([[cells[3]]], colWidths=[154 * mm])
    provider.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#E5F8EF")),
        ("BOX", (0, 0), (-1, -1), 0.8, GREEN),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return KeepTogether([
        top,
        P("↓  公司局域网：http://服务器IP:8797", "small"),
        server,
        P("↓  只有提交生成任务时才访问互联网", "small"),
        provider,
        Spacer(1, 4 * mm),
    ])


story = []

# Cover
story += [
    Spacer(1, 34 * mm),
    P("GUGU AI VISUAL STUDIO · 0.1.0", "cover_kicker"),
    P("公司局域网部署<br/>保姆级操作手册", "cover_title"),
    P("从一台电脑启动，到全公司同事注册登录、管理员审核、积分管理、备份升级。无需编程基础，按步骤操作即可。", "cover_subtitle"),
    Spacer(1, 8 * mm),
]

cover_card = Table([
    [P("适用对象", "table_head"), P("第一次部署软件的管理员、IT 同事或团队负责人", "cover_value")],
    [P("部署方式", "table_head"), P("一台 Windows 电脑作为服务器，其他同事通过浏览器访问", "cover_value")],
    [P("访问范围", "table_head"), P("仅公司局域网，不开放到互联网", "cover_value")],
    [P("预计用时", "table_head"), P("首次部署约 30 到 60 分钟", "cover_value")],
], colWidths=[32 * mm, 120 * mm])
cover_card.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#17243A")),
    ("TEXTCOLOR", (0, 0), (-1, -1), WHITE),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#32425F")),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 9),
    ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ("TOPPADDING", (0, 0), (-1, -1), 9),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
]))
story += [cover_card, Spacer(1, 18 * mm), P("版本日期：2026-10-07", "cover_subtitle"), PageBreak()]

# Reading guide and TOC
story += [
    H1("先看这一页：你最终会得到什么"),
    P("部署完成后，公司里会有一台电脑一直运行 GuGu AI Visual Studio。其他同事不需要安装软件，只要和服务器在同一个公司网络里，用浏览器打开一个地址即可。"),
    architecture_diagram(),
    callout("一句话理解", "服务器电脑相当于前台和资料室：它负责登录、排队、保存任务和团队数据；同事电脑只负责打开网页并操作。", "info"),
    H2("管理员和普通成员分别能做什么"),
    data_table(
        ["功能", "管理员", "普通成员"],
        [
            ["注册和登录", "登录后直接可用；审核成员", "先注册，审核后登录"],
            ["API Key", "可以配置和修改", "看不到，也不能修改"],
            ["积分", "调整余额、查看全员流水", "查看自己的余额和记录"],
            ["作品和任务", "查看团队汇总及各用户数据", "只看自己的任务、结果、写真和项目"],
            ["团队设置", "开关注册、设置各功能价格", "无权限"],
        ],
        [43 * mm, 57 * mm, 64 * mm],
    ),
    Spacer(1, 5 * mm),
    H2("目录"),
]
toc = TableOfContents()
toc.levelStyles = [
    ParagraphStyle("TOC1", fontName="CN-Bold", fontSize=9.2, leading=13, leftIndent=0, textColor=INK),
    ParagraphStyle("TOC2", fontName="CN", fontSize=8.2, leading=11.5, leftIndent=12, textColor=MUTED),
]
story += [
    toc,
    Spacer(1, 5 * mm),
    callout("阅读建议", "第一次部署请按第 1 到第 8 章顺序操作；日常管理员重点看第 9、10 章；升级前看第 11 章；遇到问题直接查第 12 章。", "info"),
    PageBreak(),
]

# 1
story += [
    H1("1. 部署前准备"),
    H2("1.1 选择一台服务器电脑"),
    P("建议选一台工作时间长期在线、网络稳定、不会经常被带走的 Windows 10/11 电脑。它不一定是专业服务器，但需要满足下面条件。"),
    *bullets([
        "建议 16 GB 内存，至少保留 30 GB 可用磁盘空间；作品较多时需要更大空间。",
        "优先使用网线连接公司网络；使用 Wi-Fi 时要保证信号稳定。",
        "不要让电脑自动休眠，否则同事会突然打不开页面。屏幕可以关闭，但电脑不能休眠。",
        "这台电脑需要能够访问 147 图片或火山方舟等上游接口，局域网本身不等于完全断网。",
        "建议由固定管理员保管系统登录密码、GuGu 管理员密码和 API Key。",
    ]),
    callout("推荐做法", "请公司 IT 在路由器或 DHCP 管理中为服务器电脑固定一个局域网 IP。这样电脑重启后访问地址不会变化。", "ok"),
    H2("1.2 确认你手里的程序完整"),
    P("服务器电脑上的程序文件夹中，至少应看到以下项目。文件夹名称可以不同，但不要只复制 quick-start.cmd 一个文件。"),
    code_block([
        "GuGu AI Visual Studio/",
        "  quick-start.cmd",
        "  server/",
        "  public/",
        "  scripts/",
        "  modules/",
        "  package.json",
    ]),
    H2("1.3 如果是从旧版本升级，先备份"),
    P("旧版本用户必须先停止程序，然后把以下三个文件夹复制到另一个磁盘或带日期的备份文件夹。"),
    data_table(
        ["必须备份", "里面是什么"],
        [
            ["config", "API 地址、模型和 API Key 配置"],
            ["data", "用户、会话、积分、任务、写真和角色项目"],
            ["output", "所有用户生成的结果图片"],
        ],
        [45 * mm, 119 * mm],
    ),
    callout("不要跳过", "复制备份前必须先在启动窗口按 Ctrl+C 停止服务。否则 SQLite 的 WAL 文件可能还没合并，备份可能不完整。", "danger"),
    PageBreak(),
]

# 2
story += [
    H1("2. 找到服务器的局域网 IP"),
    P("同事将通过这个 IP 访问 GuGu。下面用 Windows 设置界面查找，不需要输入命令。"),
    step(1, "打开网络设置", "点击 Windows 开始菜单，打开“设置”，进入“网络和 Internet”。"),
    step(2, "进入当前连接", "如果服务器插了网线，点击“以太网”；如果使用 Wi-Fi，点击当前已连接的 Wi-Fi 网络。"),
    step(3, "找到 IPv4 地址", "在属性页面向下找“IPv4 地址”。示例可能是 192.168.1.20、192.168.10.35 或 10.0.0.18。把它抄下来。"),
    step(4, "确认不是 127.0.0.1", "127.0.0.1 只代表本机，其他同事无法使用。真正的局域网 IP 通常以 192.168、10 或 172.16 到 172.31 开头。"),
    callout("本手册示例", "后续统一使用 192.168.1.20 作为示例。你操作时必须换成自己服务器电脑真实的 IPv4 地址。", "warn"),
    H2("2.1 建议固定这个 IP"),
    P("最稳妥的方式是请公司 IT 在路由器或 DHCP 服务器中，把该 IP 固定分配给这台电脑。不要随意手动填写网关和 DNS；填错会导致整台电脑断网。"),
    H2("2.2 提前决定访问地址"),
    code_block([
        "服务器自己访问：http://127.0.0.1:8797",
        "同事访问：http://192.168.1.20:8797",
    ]),
    P("如果 IT 已经为服务器配置了内部域名，例如 gugu.company.lan，也可以使用 http://gugu.company.lan:8797。"),
    PageBreak(),
]

# 3
story += [
    H1("3. 配置 .env 文件"),
    H2("3.1 最简单的方法"),
    step(1, "先双击一次 quick-start.cmd", "程序第一次启动会自动把 .env.example 复制成 .env。浏览器打开后先不要继续配置，回到黑色启动窗口按 Ctrl+C 停止。"),
    step(2, "显示文件扩展名", "打开文件资源管理器，选择“查看”→“显示”→勾选“文件扩展名”。确认文件确实叫 .env，而不是 .env.txt。"),
    step(3, "用记事本打开 .env", "右键 .env，选择“打开方式”→“记事本”。按实际环境修改后保存。"),
    H2("3.2 推荐配置"),
    code_block([
        "HOST=0.0.0.0",
        "PORT=8797",
        "PUBLIC_ORIGIN=http://192.168.1.20:8797",
        "ADMIN_USERNAME=admin",
        "ADMIN_PASSWORD=",
        "ADMIN_INITIAL_BALANCE=100000",
        "JOB_CONCURRENCY=1",
        "MAX_REQUEST_MB=180",
    ]),
    data_table(
        ["项目", "怎么填", "说明"],
        [
            ["HOST", "0.0.0.0", "允许局域网其他电脑连接"],
            ["PORT", "8797", "访问端口；被占用时可换成 8798"],
            ["PUBLIC_ORIGIN", "实际局域网地址", "限制写操作只能从指定地址发起"],
            ["ADMIN_USERNAME", "admin 或自定义", "首次创建后的主管理员用户名"],
            ["ADMIN_PASSWORD", "建议首次留空", "留空会在启动窗口生成一次性强密码"],
            ["ADMIN_INITIAL_BALANCE", "100000", "仅首次创建主管理员时生效"],
            ["JOB_CONCURRENCY", "1", "建议先保持 1，避免并发费用失控"],
        ],
        [35 * mm, 50 * mm, 79 * mm],
    ),
    callout("多个地址与管理员密码", "如果同事既使用 IP 又使用内部域名，可用英文逗号分隔两个 PUBLIC_ORIGIN 地址。账号数据库创建后，再修改 ADMIN_PASSWORD 不会改变已有管理员密码，请在管理后台重置。", "warn"),
    PageBreak(),
]

# 4
story += [
    H1("4. 第一次正式启动和管理员登录"),
    step(1, "双击 quick-start.cmd", "保持弹出的黑色窗口打开。关闭这个窗口，所有同事都会立即断开。"),
    step(2, "记录一次性密码", "如果 ADMIN_PASSWORD 留空，黑色窗口会显示管理员账号和一次性密码。立刻抄写到安全位置，不要发到群聊。"),
    step(3, "等待浏览器打开", "本机会自动打开 http://127.0.0.1:8797，看到“登录工作台”即表示服务已启动。"),
    step(4, "使用管理员账号登录", "用户名默认是 admin，密码使用刚才记录的一次性密码。登录后右上角会显示“管理员”和可用积分。"),
    step(5, "立即重置密码", "打开“管理后台”，选中 admin，点击“重置登录密码”。密码建议 12 位以上，同时包含大小写字母、数字和符号。提交后旧会话会失效，需要用新密码重新登录。"),
    callout("没有看到一次性密码怎么办", "先确认 data/team.db 是否已经存在。只要数据库已经创建，系统就不会再次打印密码。不要删除数据库；使用仍能登录的管理员在后台重置。若所有管理员密码都丢失，请先停止服务并联系维护人员处理。", "danger"),
    H2("4.1 启动成功的三个标志"),
    *bullets([
        "浏览器能看到登录页面，而不是“无法访问此网站”。",
        "登录后页脚显示 GuGu AI Visual Studio v0.1.0。",
        "右上角能看到用户名、可用积分、个人中心；管理员还能看到管理后台和接口设置。",
    ]),
    PageBreak(),
]

# 5
story += [
    H1("5. 管理员配置团队 API"),
    P("团队所有生成任务共用服务器上的 API 配置。普通成员无法查看或修改 API Key。"),
    step(1, "打开接口设置", "管理员登录后，点击右上角“接口设置”。"),
    step(2, "配置 147 图片", "填写服务地址和 API Key，选择需要开放的 GPT Image 模型。没有该渠道可暂时不填。"),
    step(3, "配置火山方舟", "填写 Ark API Key 和接口地址，选择 Seedream Flash 或 Pro。没有该渠道可暂时不填。"),
    step(4, "保存并检查状态", "保存后，工作台顶部会显示对应渠道“已配置”。普通成员只能看到渠道是否可用，看不到密钥内容。"),
    H2("5.1 计费规则"),
    P("进入“管理后台”→展开“团队设置与计费”。系统默认每次任务 15 积分，可分别设置图片生成、扩展、精确编辑、产品换背景、材质迁移、表情包、写真和角色素材的积分价格。"),
    callout("积分不等于供应商金额", "GuGu 积分是团队内部额度，不会替代 147 图片或火山方舟的真实账单。上游仍按实际请求收费。建议先用小额度试运行。", "warn"),
    H2("5.2 推荐的初始设置"),
    data_table(
        ["设置", "建议"],
        [
            ["注册开关", "部署测试期间开启；成员全部加入后可关闭"],
            ["单次积分", "先保持 15，了解真实成本后再调整"],
            ["管理员余额", "仅用于管理员测试，可保留 100000"],
            ["普通成员初始积分", "审核时先给 30 到 100，避免误操作造成大量费用"],
            ["并发数", "保持 JOB_CONCURRENCY=1"],
        ],
        [48 * mm, 116 * mm],
    ),
    PageBreak(),
]

# 6
story += [
    H1("6. 放行 Windows 防火墙"),
    P("如果服务器本机能打开，但同事电脑打不开，最常见原因就是 Windows 防火墙没有允许 8797 端口。推荐使用图形界面创建一条仅限“专用网络”的入站规则。"),
    step(1, "确认公司网络是专用网络", "打开 Windows 设置 → 网络和 Internet → 当前网络属性。网络配置文件选择“专用网络”。如果公司有统一 IT 策略，请先咨询 IT。"),
    step(2, "打开高级防火墙", "开始菜单搜索“高级安全 Windows Defender 防火墙”，打开后点击左侧“入站规则”。"),
    step(3, "新建规则", "点击右侧“新建规则”，选择“端口”，点击下一步。"),
    step(4, "填写端口", "选择 TCP 和“特定本地端口”，填写 8797。"),
    step(5, "允许连接", "选择“允许连接”。配置文件只勾选“专用”，不要勾选“公用”。"),
    step(6, "命名", "规则名称填写“GuGu AI Visual Studio LAN 8797”，完成。"),
    callout("高风险操作禁止", "不要在公司路由器上做 8797 端口映射，不要设置公网 IP，不要把访问地址发布到互联网。", "danger"),
    H2("6.1 用第二台电脑验证"),
    P("让一位同事在同一公司网络中打开 Chrome 或 Edge，在地址栏输入："),
    code_block(["http://192.168.1.20:8797"]),
    P("把 192.168.1.20 换成你的服务器 IPv4 地址。能看到登录页面说明局域网和防火墙已配置成功。"),
    H2("6.2 如果仍然打不开"),
    *bullets([
        "确认服务器的黑色启动窗口仍然开着。",
        "确认地址使用 http://，不是 https://。",
        "确认端口号和 .env 中 PORT 一致。",
        "确认两台电脑处于同一公司网络，而不是一台连访客 Wi-Fi。",
        "让 IT 检查无线网络是否开启了客户端隔离或 VLAN 隔离。",
    ]),
    PageBreak(),
]

# 7
story += [
    H1("7. 同事注册和管理员审核"),
    H2("7.1 同事怎么注册"),
    step(1, "打开访问地址", "同事在浏览器打开 http://服务器IP:8797。无需安装客户端。"),
    step(2, "切换到注册", "点击登录卡片上的“注册”。"),
    step(3, "填写账号", "用户名为 3 到 32 位中文、字母、数字、点、横线或下划线；密码为 8 到 128 位。建议每人使用独立账号。"),
    step(4, "等待审核", "注册成功后仍不能登录。页面会提示等待管理员审核。"),
    H2("7.2 管理员怎么审核"),
    step(1, "打开管理后台", "管理员登录后点击右上角“管理后台”。总览中的“待审核”会显示数量。"),
    step(2, "选中待审核用户", "左侧用户列表中，待审核账号会优先显示。确认用户名对应真实同事。"),
    step(3, "审核并启用", "点击“审核并启用”。账号立即变成已启用状态。"),
    step(4, "分配积分", "在积分调整中输入正整数，例如 50；备注填写“首次分配”。点击提交。"),
    step(5, "通知同事登录", "同事刷新页面，使用自己注册的用户名和密码登录。"),
    callout("账号管理原则", "一人一号，不共用账号。离职、调岗或账号异常时，管理员立即点击“停用账号”；停用会让现有登录会话失效，但不会删除历史数据。", "ok"),
    PageBreak(),
]

# 8
story += [
    H1("8. 上线前完整验收"),
    P("不要只验证管理员本机。请准备一台同事电脑和一个普通测试账号，按下面顺序逐项打勾。"),
    data_table(
        ["检查项", "正确结果", "完成"],
        [
            ["服务器启动", "黑色窗口无报错，浏览器显示登录页", "□"],
            ["局域网访问", "同事电脑可打开 http://服务器IP:8797", "□"],
            ["注册", "新账号注册后显示等待审核", "□"],
            ["未审核登录", "系统拒绝登录并提示等待审核", "□"],
            ["管理员审核", "账号启用并可增加积分", "□"],
            ["普通用户登录", "能看到个人余额，不能看到管理后台和接口设置", "□"],
            ["数据隔离", "普通用户历史为空，看不到管理员作品", "□"],
            ["小额生成", "任务排队、成功、扣积分并出现在个人历史", "□"],
            ["失败释放", "故意使用错误参数时任务失败，冻结积分释放", "□"],
            ["停用账号", "停用后该账号不能继续使用", "□"],
            ["重启恢复", "停止服务再启动，用户、余额和历史仍存在", "□"],
            ["备份", "已成功复制 config、data、output", "□"],
        ],
        [46 * mm, 101 * mm, 17 * mm],
    ),
    callout("付费测试建议", "真实生成只做一次低成本小图。确认上游账号余额、模型权限、网络连通性和返回格式后，再扩大团队积分。", "warn"),
    H2("8.1 普通成员应该看到什么"),
    *bullets([
        "右上角显示自己的用户名和可用积分。",
        "可以进入个人中心查看自己的积分流水与调用记录。",
        "看不到“管理后台”和“接口设置”。",
        "历史、生成结果、写真、角色项目只属于自己。",
    ]),
    PageBreak(),
]

# 9
story += [
    H1("9. 日常运行和管理员操作"),
    H2("9.1 每天怎么启动"),
    step(1, "登录服务器电脑", "确认公司网络已连接。"),
    step(2, "双击 quick-start.cmd", "看到启动成功地址后，可以最小化黑色窗口，但不要关闭。"),
    step(3, "管理员登录检查", "确认队列、渠道配置和用户余额正常。"),
    H2("9.2 怎么安全停止"),
    P("回到黑色启动窗口，按 Ctrl+C。等待进程结束后再关机、备份或更新。不要直接拔电源。"),
    H2("9.3 管理后台常用动作"),
    data_table(
        ["场景", "操作"],
        [
            ["新人加入", "审核并启用，再分配小额积分"],
            ["积分不足", "查看调用记录，确认合理后再增加"],
            ["员工离职", "停用账号；保留历史数据供审计"],
            ["忘记密码", "管理员重置密码；旧会话会失效"],
            ["费用异常", "先停用账号或把积分扣到接近冻结额度，再检查调用记录"],
            ["任务异常", "查看生成任务；仅删除已完成或失败的任务"],
            ["停止新注册", "关闭“允许同事自行注册”"],
        ],
        [44 * mm, 120 * mm],
    ),
    H2("9.4 可选：开机自动启动"),
    P("小团队最简单的方法是给 quick-start.cmd 创建快捷方式，并把快捷方式放进当前管理员的 Windows“启动”文件夹。由于这会跟随该 Windows 用户登录启动，服务器仍需要保持该账号登录。企业环境建议让 IT 使用任务计划程序统一管理。"),
    callout("首次部署不要直接做后台自启动", "先完成管理员密码记录、API 配置、浏览器验收和备份，再配置自动启动。否则启动窗口中的一次性密码可能被忽略。", "warn"),
    PageBreak(),
]

# 10
story += [
    H1("10. 数据备份与恢复"),
    H2("10.1 三个目录必须一起备份"),
    data_table(
        ["目录", "必须保留的原因"],
        [
            ["config", "保存团队 API 配置和密钥"],
            ["data", "保存 team.db、用户、积分、任务元数据、角色项目和写真"],
            ["output", "保存生成结果及对比原图"],
        ],
        [42 * mm, 122 * mm],
    ),
    H2("10.2 手工备份步骤"),
    step(1, "通知同事暂停使用", "避免备份时仍有任务写入。"),
    step(2, "按 Ctrl+C 停止服务", "确认启动窗口已经退出。"),
    step(3, "创建日期文件夹", "例如 GuGu-backup-2026-10-07。"),
    step(4, "复制三个目录", "把 config、data、output 完整复制到备份文件夹。不要漏掉 data/team.db-wal 或 team.db-shm。"),
    step(5, "检查大小", "确认备份中三个目录都存在，文件数量和原目录接近。"),
    step(6, "重新启动服务", "双击 quick-start.cmd，再登录确认。"),
    H2("10.3 推荐备份频率"),
    *bullets([
        "日常使用：每天至少一次。",
        "程序升级或修改 API 配置前：立即备份。",
        "重要项目完成后：立即备份。",
        "至少保留一份不在服务器同一硬盘上的副本。",
    ]),
    H2("10.4 恢复步骤"),
    P("停止服务，把当前 config、data、output 先改名留存，再从同一次备份中复制三个目录回来，最后重新启动。不要混用不同日期的 data 与 output，否则历史记录可能找不到对应文件。"),
    P("<b>特别提醒：</b>浏览器 3D 场景保存在每位成员电脑的浏览器站点数据中，不在服务器备份内。重要截图应主动下载保存。"),
    PageBreak(),
]

# 11
story += [
    H1("11. 程序升级流程"),
    P("升级原则是：先停机、再备份、只替换程序文件、保留团队数据。"),
    step(1, "查看当前版本", "登录后查看页面底部版本号。"),
    step(2, "通知停机", "确认没有排队中或运行中的任务。"),
    step(3, "停止服务并完整备份", "按 Ctrl+C，备份 config、data、output 和 .env。"),
    step(4, "解压新版到新文件夹", "不要直接在运行中的旧目录里覆盖。"),
    step(5, "复制团队数据", "把旧版的 config、data、output 和 .env 复制到新版目录。"),
    step(6, "启动新版", "双击新版 quick-start.cmd，登录并检查版本、用户、余额、历史和角色项目。"),
    step(7, "保留旧目录一段时间", "确认新版本稳定后再归档旧目录。"),
    callout("禁止操作", "不要只复制 data/team.db 而丢掉 output；不要删除 team.db 重新开始；不要在服务运行中覆盖 server 或 public 文件。", "danger"),
    H2("11.1 回退方法"),
    P("如果新版无法使用：停止新版，把新版目录改名，重新启动保留的旧版目录。若新版已经产生了新数据，应先备份新版的 config、data、output，再决定是否恢复旧备份。"),
    PageBreak(),
]

# 12
story += [
    H1("12. 常见问题排查"),
    data_table(
        ["现象", "先检查", "解决办法"],
        [
            ["双击后窗口一闪而过", "程序是否完整、Node 是否可用", "查看项目目录是否有 runtime；源码版需 Node.js 22.13 以上"],
            ["提示端口被占用", "是否已经启动过一次", "先访问页面；若是其他软件占用，把 .env 的 PORT 改为 8798"],
            ["服务器本机能开，同事打不开", "防火墙、IP、网络隔离", "放行专用网络 TCP 端口；确认同一 VLAN"],
            ["登录总是失败", "账号状态和密码", "管理员检查是否待审核/停用；必要时重置密码"],
            ["提示登录次数过多", "是否连续输错 5 次", "等待 10 分钟后再试，不要继续反复输入"],
            ["注册按钮不见了", "团队注册开关", "管理员在团队设置中重新开启"],
            ["看不到管理后台", "当前账号角色", "只有主管理员账号有权限"],
            ["积分不足", "可用积分和冻结积分", "等待任务结束或由管理员调整余额"],
            ["生成失败但积分减少", "个人流水与调用记录", "失败应释放冻结积分；上游可能仍产生真实费用，检查供应商账单"],
            ["页面能开但生成失败", "API 配置、余额、模型权限", "管理员检查接口设置和上游账户"],
            ["重启后 IP 变了", "IPv4 地址", "让 IT 配置 DHCP 保留或内部域名"],
            ["历史图片打不开", "output 是否完整", "从同一日期备份恢复 data 和 output"],
        ],
        [43 * mm, 47 * mm, 74 * mm],
    ),
    H2("12.1 健康检查地址"),
    P("管理员可在浏览器打开下面地址。看到包含 ok、app 和 version 的 JSON，说明服务进程正在运行。"),
    code_block(["http://192.168.1.20:8797/api/health"]),
    H2("12.2 需要向维护人员提供什么"),
    *bullets([
        "页面底部版本号。",
        "问题发生时间和操作步骤。",
        "启动窗口最后几行错误信息的截图，发送前遮住密码和 API Key。",
        "是所有人都失败，还是只有某一个账号失败。",
        "不要直接发送 config/settings.json、.env 或完整数据库。",
    ]),
    PageBreak(),
]

# 13
story += [
    H1("13. 公司内网安全清单"),
    P("局域网部署不等于天然安全。上线前请逐项确认。"),
    data_table(
        ["安全项目", "要求", "完成"],
        [
            ["公网隔离", "路由器没有做 8797 端口映射", "□"],
            ["防火墙", "入站规则只允许专用网络", "□"],
            ["固定来源", ".env 已填写真实 PUBLIC_ORIGIN", "□"],
            ["管理员密码", "已更换一次性密码，且没有发到群聊", "□"],
            ["API Key", "只有管理员掌握，不在截图和文档中暴露", "□"],
            ["账号制度", "一人一号；离职立即停用", "□"],
            ["注册开关", "人员加入完成后按需关闭", "□"],
            ["积分限制", "新人先分配小额积分", "□"],
            ["备份", "已有异盘备份且测试过恢复流程", "□"],
            ["服务器", "关闭自动休眠，开启系统更新与磁盘空间监控", "□"],
        ],
        [42 * mm, 105 * mm, 17 * mm],
    ),
    H2("13.1 关于 HTTP 和 HTTPS"),
    P("本手册的基础方案使用 HTTP，适合受信任、隔离良好的公司内网。HTTP 登录信息在网络传输中不加密。如果公司使用共享 Wi-Fi、跨 VLAN、VPN、零信任接入，或有更高安全要求，应让 IT 在 GuGu 前面部署内部 HTTPS 反向代理，并使用公司内部证书。"),
    callout("不要自行忽略证书警告", "HTTPS 需要由 IT 正确配置证书。不要教成员点击“继续访问不安全网站”，也不要使用来历不明的自签名证书。", "danger"),
    H2("13.2 数据责任"),
    *bullets([
        "上传人物照片前确认已获得授权，并遵守公司隐私制度。",
        "管理员能看到团队使用汇总和各用户内容清单，应限制管理员账号使用范围。",
        "停用账号不会自动删除内容，便于审计；需要删除时应先确认公司留存政策并备份。",
        "上游模型服务会接收主动提交的图片与提示词，使用前确认供应商条款。",
    ]),
    PageBreak(),
]

# 14 quick cards
story += [
    H1("14. 一页速查卡"),
    H2("服务器管理员每天"),
    data_table(
        ["时间", "动作"],
        [
            ["上班后", "启动 quick-start.cmd，确认页面和渠道状态"],
            ["使用中", "关注磁盘空间、任务队列和异常积分消耗"],
            ["有人注册", "核对身份，审核并分配小额积分"],
            ["下班前", "确认无运行任务，按 Ctrl+C 停止后执行备份"],
        ],
        [38 * mm, 126 * mm],
    ),
    H2("同事使用说明"),
    code_block([
        "1. 打开：http://服务器IP:8797",
        "2. 第一次点击“注册”",
        "3. 等管理员审核和分配积分",
        "4. 登录后使用自己的工作区",
        "5. 积分不足或忘记密码时联系管理员",
    ]),
    H2("最重要的四条"),
    callout("01 不开公网", "只允许公司局域网访问，禁止路由器端口映射。", "danger"),
    callout("02 不关启动窗口", "启动窗口关闭后，所有同事都会断线。", "warn"),
    callout("03 三个目录一起备份", "config、data、output 缺一不可。", "info"),
    callout("04 一人一号", "管理员控制审核、积分和停用，普通成员只看自己的数据。", "ok"),
    PageBreak(),
    H1("附录：部署信息记录页"),
    P("建议打印本页，由服务器管理员填写后放入内部运维资料。密码和 API Key 不要写在这里。"),
    data_table(
        ["项目", "请填写"],
        [
            ["首次部署日期", "________________________________"],
            ["服务器电脑名称", "________________________________"],
            ["服务器局域网 IP", "________________________________"],
            ["访问端口", "________________________________"],
            ["团队访问地址", "________________________________"],
            ["PUBLIC_ORIGIN", "________________________________"],
            ["管理员用户名", "________________________________"],
            ["备份位置", "________________________________"],
            ["维护负责人", "________________________________"],
            ["最近一次恢复演练", "________________________________"],
        ],
        [50 * mm, 114 * mm],
    ),
    Spacer(1, 6 * mm),
    H2("交接确认"),
    *bullets([
        "□ 已说明如何启动和停止服务。",
        "□ 已说明如何审核、停用账号和调整积分。",
        "□ 已说明 config、data、output 必须一起备份。",
        "□ 已确认没有公网端口映射。",
        "□ 已将管理员密码和 API Key 存放在公司认可的密码管理位置。",
    ]),
    Spacer(1, 5 * mm),
    P("交接人签字：________________________　　日期：________________", "body"),
    P("接收人签字：________________________　　日期：________________", "body"),
    Spacer(1, 8 * mm),
    HRFlowable(width="100%", thickness=0.7, color=LINE),
    Spacer(1, 4 * mm),
    P("手册对应 GuGu AI Visual Studio 0.1.0 局域网团队版。项目内验证记录：docs/verification-0.1.0.md。", "small"),
]


doc = ManualDocTemplate(str(OUTPUT))
doc.multiBuild(story)

metadata_path = OUTPUT.with_suffix(".metadata.pdf")
reader = PdfReader(str(OUTPUT))
writer = PdfWriter()
writer.clone_document_from_reader(reader)
writer.add_metadata({
    "/Title": "GuGu AI Visual Studio 0.1.0 局域网部署保姆级手册",
    "/Author": "GuGu AI Visual Studio",
    "/Subject": "公司局域网团队版部署、使用、备份与排障",
})
with metadata_path.open("wb") as stream:
    writer.write(stream)
metadata_path.replace(OUTPUT)
print(OUTPUT)
