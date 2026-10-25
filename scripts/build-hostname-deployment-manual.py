from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
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
OUTPUT = ROOT / "output" / "pdf" / "GuGu-0.1.0-Computer-Name-Shared-Folder-Deployment-Guide-CN.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

FONT = Path(r"C:\Windows\Fonts\msyh.ttc")
FONT_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
if not FONT.exists():
    FONT = Path(r"C:\Windows\Fonts\simhei.ttf")
if not FONT_BOLD.exists():
    FONT_BOLD = FONT
pdfmetrics.registerFont(TTFont("CN2", str(FONT)))
pdfmetrics.registerFont(TTFont("CN2-Bold", str(FONT_BOLD)))

PAGE_W, PAGE_H = A4
NAVY = colors.HexColor("#0F1726")
INK = colors.HexColor("#172033")
MUTED = colors.HexColor("#5D6878")
PURPLE = colors.HexColor("#7657F6")
CYAN = colors.HexColor("#35D3CC")
GREEN = colors.HexColor("#25BC78")
AMBER = colors.HexColor("#E8A93A")
RED = colors.HexColor("#E55E68")
LINE = colors.HexColor("#DDE3ED")
LIGHT = colors.HexColor("#F5F7FB")
WHITE = colors.white


class Manual(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=20 * mm,
            bottomMargin=18 * mm,
            title="GuGu AI Visual Studio 0.1.0 电脑名称访问简化部署手册",
            author="GuGu AI Visual Studio",
            subject="通过电脑名称和共享文件夹入口部署 GuGu AI Visual Studio",
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="main", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate(id="main", frames=[frame], onPage=page_decor))

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and getattr(flowable, "toc_level", None) is not None:
            text = flowable.getPlainText()
            key = f"chapter-{self.seq.nextf('chapter')}"
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text, key, level=0, closed=False)
            self.notify("TOCEntry", (0, text, self.page, key))


def page_decor(canvas, doc):
    canvas.saveState()
    if doc.page == 1:
        canvas.setFillColor(NAVY)
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    else:
        canvas.setFillColor(colors.HexColor("#FCFDFE"))
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        canvas.setStrokeColor(LINE)
        canvas.line(18 * mm, PAGE_H - 13 * mm, PAGE_W - 18 * mm, PAGE_H - 13 * mm)
        canvas.setFont("CN2", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(18 * mm, PAGE_H - 10 * mm, "GuGu 0.1.0 · 电脑名称访问与共享入口部署手册")
        canvas.drawRightString(PAGE_W - 18 * mm, 10 * mm, f"第 {doc.page} 页")
    canvas.restoreState()


S = {
    "cover_kicker": ParagraphStyle("cover_kicker", fontName="CN2-Bold", fontSize=11, leading=16, textColor=CYAN, spaceAfter=12),
    "cover_title": ParagraphStyle("cover_title", fontName="CN2-Bold", fontSize=28, leading=39, textColor=WHITE, spaceAfter=14),
    "cover_sub": ParagraphStyle("cover_sub", fontName="CN2", fontSize=12.5, leading=21, textColor=colors.HexColor("#C8D2E4"), spaceAfter=12),
    "cover_cell": ParagraphStyle("cover_cell", fontName="CN2", fontSize=9, leading=14, textColor=colors.HexColor("#DDE6F4")),
    "h1": ParagraphStyle("h1", fontName="CN2-Bold", fontSize=21, leading=29, textColor=INK, spaceAfter=12, keepWithNext=True),
    "h2": ParagraphStyle("h2", fontName="CN2-Bold", fontSize=14, leading=21, textColor=colors.HexColor("#4F3CC4"), spaceBefore=11, spaceAfter=7, keepWithNext=True),
    "body": ParagraphStyle("body", fontName="CN2", fontSize=9.5, leading=16, textColor=INK, spaceAfter=6),
    "small": ParagraphStyle("small", fontName="CN2", fontSize=8.2, leading=13.5, textColor=MUTED, spaceAfter=4),
    "bullet": ParagraphStyle("bullet", fontName="CN2", fontSize=9.2, leading=15.5, textColor=INK, leftIndent=11, firstLineIndent=-8, spaceAfter=4),
    "step_title": ParagraphStyle("step_title", fontName="CN2-Bold", fontSize=11.3, leading=17, textColor=INK, spaceAfter=2),
    "step_body": ParagraphStyle("step_body", fontName="CN2", fontSize=9.1, leading=15, textColor=INK),
    "callout": ParagraphStyle("callout", fontName="CN2", fontSize=9.2, leading=15.5, textColor=INK),
    "code": ParagraphStyle("code", fontName="CN2", fontSize=8.5, leading=14, textColor=colors.HexColor("#E8EEFB")),
    "th": ParagraphStyle("th", fontName="CN2-Bold", fontSize=8.5, leading=13, textColor=WHITE),
    "td": ParagraphStyle("td", fontName="CN2", fontSize=8.2, leading=13, textColor=INK),
}


def p(text, style="body"):
    return Paragraph(text, S[style])


def h1(text):
    item = p(text, "h1")
    item.toc_level = 0
    return item


def h2(text):
    return p(text, "h2")


def bullet_list(items):
    return [p(f"<font color='#7657F6'>●</font>&nbsp;&nbsp;{item}", "bullet") for item in items]


def step(number, title, text):
    badge = Table([[p(str(number), "step_title")]], colWidths=[10 * mm], rowHeights=[10 * mm])
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
    table = Table([[badge, [p(title, "step_title"), p(text, "step_body")]]], colWidths=[13 * mm, 150 * mm])
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
        "info": (colors.HexColor("#EEEAFE"), PURPLE),
        "ok": (colors.HexColor("#E5F8EF"), GREEN),
        "warn": (colors.HexColor("#FFF3D9"), AMBER),
        "danger": (colors.HexColor("#FDEBED"), RED),
    }
    bg, accent = palette[tone]
    table = Table([[p(f"<b>{title}</b><br/>{text}", "callout")]], colWidths=[164 * mm])
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


def code(lines):
    value = "<br/>".join(line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") for line in lines)
    table = Table([[p(value, "code")]], colWidths=[164 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#293753")),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return KeepTogether([table, Spacer(1, 4 * mm)])


def grid(headers, rows, widths):
    data = [[p(str(x), "th") for x in headers]] + [[p(str(x), "td") for x in row] for row in rows]
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def simple_flow():
    top = Table([
        [p("<b>你的电脑</b><br/><font color='#5D6878'>运行唯一一份 GuGu</font>", "body")],
        [p("↓　共享文件夹只负责发放访问入口", "small")],
        [p("<b>打开 GuGu.url</b><br/><font color='#5D6878'>同事从共享目录双击</font>", "body")],
        [p("↓　默认浏览器通过电脑名称访问", "small")],
        [p("<b>同事的浏览器</b><br/><font color='#5D6878'>打开 http://design-pc:8797</font>", "body")],
    ], colWidths=[154 * mm])
    top.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#EDE9FE")),
        ("BACKGROUND", (0, 2), (0, 2), colors.HexColor("#E6F2FF")),
        ("BACKGROUND", (0, 4), (0, 4), colors.HexColor("#E5F8EF")),
        ("BOX", (0, 0), (0, 0), 1, PURPLE),
        ("BOX", (0, 2), (0, 2), 1, colors.HexColor("#689AD2")),
        ("BOX", (0, 4), (0, 4), 1, GREEN),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return top


story = []

# Cover
story += [
    Spacer(1, 34 * mm),
    p("GUGU AI VISUAL STUDIO · 0.1.0", "cover_kicker"),
    p("不需要知道服务器 IP<br/>电脑名称访问部署手册", "cover_title"),
    p("适用于：你和同事已经能通过共享文件互相访问，希望由你的电脑运行 GuGu，让同事从共享目录双击入口即可使用。", "cover_sub"),
    Spacer(1, 8 * mm),
]
cover = Table([
    [p("核心方式", "th"), p("你的电脑运行 GuGu，同事使用浏览器访问", "cover_cell")],
    [p("访问地址", "th"), p("http://你的电脑名称:8797", "cover_cell")],
    [p("共享目录", "th"), p("只放“打开 GuGu.url”，不放运行数据库", "cover_cell")],
    [p("是否改代码", "th"), p("不需要，当前 0.1.0 已支持", "cover_cell")],
    [p("预计用时", "th"), p("20 到 40 分钟", "cover_cell")],
], colWidths=[35 * mm, 117 * mm])
cover.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#17243A")),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#32425F")),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 9),
    ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story += [cover, Spacer(1, 18 * mm), p("版本日期：2026-10-07", "cover_sub"), PageBreak()]

# Overview + TOC
story += [
    h1("先看这一页：这种方式能不能用"),
    p("可以使用，但共享文件夹的正确用途是“发放访问入口”，不是让多人直接运行同一份程序。GuGu 必须只在一台电脑上运行，其他同事通过浏览器访问。"),
    simple_flow(),
    Spacer(1, 5 * mm),
    callout("绝对不要这样做", "不要把整个 GuGu 放进共享目录后让每位同事运行；不要让多台电脑同时打开同一个 data/team.db。这样可能造成数据库锁、文件冲突和数据损坏。", "danger"),
    h2("先判断你们的共享方式"),
    grid(
        ["共享方式", "说明", "是否证明能直连你的电脑"],
        [
            ["\\\\你的电脑名称\\共享文件夹", "共享文件由你的电脑提供", "通常可以，优先试电脑名称访问"],
            ["\\\\NAS名称\\共享文件夹", "所有人访问同一台 NAS", "不一定，仍需测试你的电脑名称"],
            ["OneDrive、企业网盘、聊天软件", "文件通过云端同步", "不能证明在同一可互访网络"],
        ],
        [48 * mm, 62 * mm, 54 * mm],
    ),
    PageBreak(),
    p("目录", "h1"),
]
toc = TableOfContents()
toc.levelStyles = [ParagraphStyle("toc_simple", fontName="CN2-Bold", fontSize=10, leading=18, textColor=INK)]
story += [
    toc,
    Spacer(1, 6 * mm),
    callout("最短路线", "找到电脑名称 → 配置 .env → 防火墙放行 8797 → 启动 GuGu → 同事测试 → 在共享目录放 .url 快捷入口。", "info"),
    PageBreak(),
]

# 1
story += [
    h1("1. 选定运行 GuGu 的电脑"),
    p("下面统一把运行 GuGu 的电脑叫作“主机”。通常就是你的电脑。"),
    *bullet_list([
        "主机在同事使用期间必须开机，并且不能休眠。",
        "主机应连接稳定的公司网络，优先使用网线。",
        "GuGu 程序、API Key、团队数据库和作品都保存在主机本地。",
        "同事电脑不需要安装 GuGu，也不需要访问程序文件夹。",
        "主机需要能够访问图片模型供应商，否则页面能打开但无法生成。",
    ]),
    h2("1.1 程序应该放在哪里"),
    p("把整个 GuGu AI Visual Studio 文件夹放在主机本地磁盘，例如 D 盘。不要放在 NAS、OneDrive 同步目录或所有人可写的共享目录。"),
    code([
        "推荐：D:\\Apps\\GuGu",
        "不推荐：\\\\NAS\\公共目录\\GuGu",
        "不推荐：OneDrive\\团队共享\\GuGu",
    ]),
    h2("1.2 关闭主机自动休眠"),
    step(1, "打开电源设置", "Windows 设置 → 系统 → 电源和电池。"),
    step(2, "展开屏幕和睡眠", "插入电源时，可以让屏幕关闭，但把“使设备进入睡眠状态”设置为“从不”。"),
    callout("为什么", "主机一旦休眠、关机或离开公司网络，所有同事都会打不开 GuGu。", "warn"),
    PageBreak(),
]

# 2
story += [
    h1("2. 找到主机电脑名称"),
    p("这个方案不要求你知道 IP，只需要知道主机的 Windows 设备名称。"),
    step(1, "打开 Windows 设置", "点击开始菜单 → 设置 → 系统。"),
    step(2, "进入系统信息", "在系统页面向下滚动，打开“系统信息”或“关于”。"),
    step(3, "抄下设备名称", "找到“设备名称”。例如 DESIGN-PC、GUGU-SERVER 或 OFFICE-008。"),
    step(4, "核对共享路径", "如果同事平时使用的共享路径是 \\\\DESIGN-PC\\共享资料，那么 DESIGN-PC 很可能就是你的电脑名称。"),
    callout("本手册示例", "后续使用 DESIGN-PC 作为示例。你操作时必须替换成自己的真实设备名称。浏览器地址建议写成小写 design-pc。", "info"),
    h2("2.1 先记下将来使用的地址"),
    code([
        "主机自己打开：http://127.0.0.1:8797",
        "同事打开：http://design-pc:8797",
        "健康检查：http://design-pc:8797/api/health",
    ]),
    h2("2.2 如果设备名称有中文或空格"),
    p("建议让公司 IT 把设备名称改成简短的英文、数字和横线，例如 GUGU-SERVER。改名通常需要重启，重启后共享路径也会改变，必须提前通知同事。"),
    PageBreak(),
]

# 3
story += [
    h1("3. 启动一次并生成 .env"),
    step(1, "确认程序完整", "项目目录中应看到 quick-start.cmd、server、public、scripts、modules 和 package.json。"),
    step(2, "双击 quick-start.cmd", "第一次启动会自动创建 .env，并打开本机登录页面。"),
    step(3, "记录管理员一次性密码", "如果黑色启动窗口显示一次性管理员密码，立即记录到安全位置。不要发到共享文件夹或群聊。"),
    step(4, "暂时停止", "回到黑色窗口按 Ctrl+C，等待窗口结束。接下来修改 .env。"),
    h2("3.1 找不到 .env 怎么办"),
    p("在文件资源管理器选择“查看”→“显示”→勾选“隐藏的项目”和“文件扩展名”。文件名必须是 .env，不是 .env.txt。"),
    callout("已有旧版用户", "如果 config、data、output 中已经有作品和账号，修改前先停止服务，并完整备份这三个目录。", "danger"),
    h2("3.2 不要删除 team.db"),
    p("管理员密码、用户、积分和任务都在 data/team.db 中。不要为了重新看到一次性密码而删除数据库。忘记密码应由仍能登录的管理员在后台重置。"),
    PageBreak(),
]

# 4
story += [
    h1("4. 配置电脑名称访问"),
    step(1, "用记事本打开 .env", "右键 .env → 打开方式 → 记事本。"),
    step(2, "填写推荐配置", "把 design-pc 替换成你的真实电脑名称，并使用小写。"),
    code([
        "HOST=0.0.0.0",
        "PORT=8797",
        "PUBLIC_ORIGIN=http://design-pc:8797",
        "ADMIN_USERNAME=admin",
        "ADMIN_PASSWORD=",
        "ADMIN_INITIAL_BALANCE=100000",
        "JOB_CONCURRENCY=1",
        "MAX_REQUEST_MB=180",
    ]),
    step(3, "保存", "记事本点击“文件”→“保存”，然后关闭。"),
    h2("4.1 每一项是什么意思"),
    grid(
        ["配置", "必须填写", "作用"],
        [
            ["HOST", "0.0.0.0", "允许局域网其他电脑连接"],
            ["PORT", "8797", "浏览器地址的端口"],
            ["PUBLIC_ORIGIN", "http://电脑名:8797", "允许这个固定来源提交写操作"],
            ["ADMIN_USERNAME", "admin", "首次主管理员用户名"],
            ["ADMIN_PASSWORD", "首次可留空", "留空时生成一次性强密码"],
            ["JOB_CONCURRENCY", "1", "一次只跑一个任务，便于控制费用"],
        ],
        [42 * mm, 49 * mm, 73 * mm],
    ),
    callout("最省事的临时测试", "如果不确定电脑名称是否正确，可先把 PUBLIC_ORIGIN 留空。确认所有同事都能访问后，再填写固定地址并重启。", "warn"),
    PageBreak(),
]

# 5
story += [
    h1("5. 放行 Windows 防火墙"),
    p("共享文件能访问，不代表 8797 端口已经放行。必须在主机上创建一条仅用于公司专用网络的规则。"),
    step(1, "确认网络类型", "Windows 设置 → 网络和 Internet → 当前连接，确认网络配置文件是“专用网络”。公司统一管理的电脑请先问 IT。"),
    step(2, "打开高级防火墙", "开始菜单搜索“高级安全 Windows Defender 防火墙”。"),
    step(3, "进入入站规则", "左侧点击“入站规则”，右侧点击“新建规则”。"),
    step(4, "选择端口", "选择“端口”→ TCP → 特定本地端口 → 输入 8797。"),
    step(5, "允许连接", "选择“允许连接”。配置文件只勾选“专用”，不要勾选“公用”。"),
    step(6, "填写名称", "输入 GuGu AI Visual Studio LAN 8797，然后完成。"),
    callout("严禁公网开放", "不要在公司路由器上做 8797 端口映射，不要申请公网 IP，不要把访问地址发到外部群。", "danger"),
    h2("5.1 公司策略不允许改防火墙怎么办"),
    p("不要关闭整个 Windows 防火墙。把本手册交给 IT，请 IT 只为主机的专用网络放行 TCP 8797。"),
    PageBreak(),
]

# 6
story += [
    h1("6. 正式启动并登录管理员"),
    step(1, "双击 quick-start.cmd", "黑色启动窗口出现后不要关闭，可以最小化。"),
    step(2, "等待本机页面打开", "主机会打开 http://127.0.0.1:8797。看到“登录工作台”表示服务启动成功。"),
    step(3, "管理员登录", "默认用户名是 admin。密码使用第一次启动时记录的一次性密码。"),
    step(4, "立即重置管理员密码", "进入“管理后台”，选中 admin，点击“重置登录密码”。提交后重新登录。"),
    step(5, "配置团队 API", "点击“接口设置”，填写团队使用的 API 地址和 API Key。普通成员无法查看密钥。"),
    callout("启动窗口必须保留", "关闭黑色启动窗口，所有同事都会断开。主机重启后也必须重新启动 quick-start.cmd。", "warn"),
    h2("6.1 主机自检"),
    *bullet_list([
        "页脚显示 GuGu AI Visual Studio v0.1.0。",
        "右上角显示 admin、可用积分、个人中心、管理后台、接口设置。",
        "接口设置保存后，工作台显示相应渠道已配置。",
    ]),
    PageBreak(),
]

# 7
story += [
    h1("7. 让一位同事先测试"),
    p("不要一开始就通知所有人。先找一位同事，在同一公司网络中完成以下测试。"),
    step(1, "打开健康检查", "同事在 Edge 或 Chrome 地址栏输入：http://design-pc:8797/api/health"),
    step(2, "观察结果", "如果页面显示 ok、GuGu AI Visual Studio 和 0.1.0，说明电脑名称、网络和防火墙都正常。"),
    code([
        "正常示例：",
        '{"ok":true,"app":"GuGu AI Visual Studio","version":"0.1.0"}',
    ]),
    step(3, "打开登录页", "把地址末尾 /api/health 删除，打开 http://design-pc:8797。"),
    step(4, "测试注册", "点击“注册”，创建一个普通测试账号。注册完成后应提示等待管理员审核。"),
    h2("7.1 如果打不开"),
    grid(
        ["现象", "优先检查"],
        [
            ["找不到 design-pc", "电脑名称解析失败；核对名称，必要时找 IT 或改用 IP"],
            ["连接被拒绝", "主机没有启动 GuGu，或端口写错"],
            ["一直等待后超时", "防火墙、访客 Wi-Fi、VLAN 或客户端隔离"],
            ["能开登录页但不能提交", "PUBLIC_ORIGIN 与浏览器地址不一致"],
        ],
        [60 * mm, 104 * mm],
    ),
    callout("重要判断", "如果共享文件来自 NAS 或云盘，健康检查打不开并不代表 GuGu 有问题，只说明同事不能通过当前网络直接访问你的电脑。此时需要 IT 协助放行或提供固定内网地址。", "info"),
    PageBreak(),
]

# 8
story += [
    h1("8. 在共享文件夹放一个双击入口"),
    p("测试成功后，可以把一个很小的 .url 文件放到大家都能访问的共享文件夹。同事双击它，就会用默认浏览器打开 GuGu。"),
    step(1, "新建文本文件", "在你本地桌面右键 → 新建 → 文本文档。"),
    step(2, "打开并填写内容", "用记事本打开，填写下面两行。把 design-pc 换成真实电脑名称。"),
    code([
        "[InternetShortcut]",
        "URL=http://design-pc:8797",
    ]),
    step(3, "另存为 .url", "选择“文件”→“另存为”，文件名填写“打开 GuGu AI Visual Studio.url”，保存类型选择“所有文件”，编码保持 UTF-8。"),
    step(4, "先自己双击测试", "确认它会打开正确的 GuGu 登录页面。"),
    step(5, "复制到共享文件夹", "共享目录中只需要放这个 .url 文件和使用说明，不要复制 GuGu 程序、.env、config、data 或 output。"),
    callout("共享目录推荐内容", "打开 GuGu AI Visual Studio.url + 一份同事使用说明。共享目录不要给普通成员提供团队数据库或 API 配置。", "ok"),
    h2("8.1 如果公司阻止 .url 文件"),
    p("可以放一个“GuGu 访问地址.txt”，里面只写 http://design-pc:8797，让同事复制到浏览器。也可以请 IT 通过内部软件门户或浏览器收藏夹统一分发。"),
    PageBreak(),
]

# 9
story += [
    h1("9. 同事注册、管理员审核和积分"),
    h2("9.1 同事操作"),
    step(1, "双击共享入口", "打开 GuGu 登录页面。"),
    step(2, "点击注册", "填写自己的独立用户名和密码，不要多人共用账号。"),
    step(3, "等待审核", "注册后不能立即登录，需要管理员审核。"),
    h2("9.2 管理员操作"),
    step(1, "打开管理后台", "管理员登录后点击右上角“管理后台”。"),
    step(2, "选择待审核账号", "核对用户名对应真实同事。"),
    step(3, "审核并启用", "点击“审核并启用”。"),
    step(4, "分配小额积分", "首次建议分配 30 到 100 积分，备注填写“首次分配”。"),
    step(5, "通知同事登录", "同事刷新页面后即可使用。"),
    callout("权限结果", "普通成员看不到管理后台和接口设置，只能查看自己的任务、积分、作品、写真和角色项目。", "ok"),
    h2("9.3 成员全部加入后"),
    p("管理员可以在“团队设置与计费”中关闭自行注册。以后有新人时再临时开启。"),
    PageBreak(),
]

# 10
story += [
    h1("10. 上线验收清单"),
    p("以下项目全部通过后，再通知整个团队使用。"),
    grid(
        ["检查项", "正确结果", "完成"],
        [
            ["主机启动", "黑色窗口正常，登录页可打开", "□"],
            ["电脑名称", "同事能打开 http://电脑名:8797/api/health", "□"],
            ["防火墙", "只对专用网络放行 TCP 8797", "□"],
            ["共享入口", ".url 双击能打开正确页面", "□"],
            ["注册", "新账号注册后等待审核", "□"],
            ["普通用户权限", "看不到管理后台和接口设置", "□"],
            ["积分", "管理员可增加，普通用户可查看余额", "□"],
            ["数据隔离", "测试账号看不到管理员历史", "□"],
            ["小额生成", "任务成功、扣积分并进入个人历史", "□"],
            ["失败释放", "失败任务不会永久占用冻结积分", "□"],
            ["重启", "重启后用户、余额和记录仍存在", "□"],
            ["备份", "config、data、output 已一起备份", "□"],
        ],
        [48 * mm, 99 * mm, 17 * mm],
    ),
    callout("不要跳过小额生成", "页面能打开只证明局域网正常。还需要用一次低成本任务确认 API Key、上游余额、模型权限和互联网访问。", "warn"),
    h2("10.1 试运行建议"),
    *bullet_list([
        "第一天只开放给 1 到 3 位同事。",
        "每人只分配少量积分。",
        "观察调用记录、失败率和上游真实账单。",
        "确认稳定后再扩大范围。",
    ]),
    PageBreak(),
]

# 11
story += [
    h1("11. 每天怎么运行、停止和备份"),
    h2("11.1 上班时"),
    step(1, "确认主机联网", "连接公司网络。"),
    step(2, "双击 quick-start.cmd", "黑色窗口可以最小化，不能关闭。"),
    step(3, "打开管理员页面", "确认渠道、队列和磁盘空间正常。"),
    h2("11.2 下班或维护时"),
    step(1, "确认没有运行任务", "管理后台查看运行中和排队中数量。"),
    step(2, "通知同事暂停", "避免有人正在提交任务。"),
    step(3, "按 Ctrl+C 停止", "在黑色窗口中停止服务。"),
    step(4, "完整备份", "把 config、data、output 三个目录复制到带日期的备份文件夹。"),
    callout("三个目录缺一不可", "config 保存 API 配置；data 保存用户、积分和项目；output 保存结果图片。恢复时必须使用同一日期的完整备份。", "danger"),
    h2("11.3 主机重启后"),
    p("电脑重启后需要重新双击 quick-start.cmd。同事的共享入口不需要修改，只要电脑名称和端口没有变化。"),
    PageBreak(),
]

# 12
story += [
    h1("12. 常见问题快速排查"),
    grid(
        ["问题", "原因", "处理方法"],
        [
            ["同事打不开，主机能打开", "防火墙或网络隔离", "检查专用网络入站规则；找 IT 检查 VLAN"],
            ["电脑名称找不到", "名称解析不可用", "核对设备名称；让 IT 配置名称解析或使用固定 IP"],
            ["共享文件能开，GuGu 不能开", "共享来自 NAS/云端，或端口未放行", "先测 /api/health，再检查防火墙"],
            ["提交时提示来源不受信任", "PUBLIC_ORIGIN 写错", "必须与浏览器地址完全一致，然后重启"],
            ["端口被占用", "GuGu 已运行或其他程序占用", "先尝试访问；必要时把 PORT 改为 8798"],
            ["注册按钮不见了", "管理员关闭注册", "在团队设置中重新开启"],
            ["账号不能登录", "待审核、停用或密码错误", "管理员检查状态或重置密码"],
            ["提示登录次数过多", "连续错误 5 次", "等待 10 分钟再试"],
            ["能登录但不能生成", "API、上游余额或互联网问题", "管理员检查接口设置和供应商账户"],
            ["同事突然全部断线", "主机休眠、关机或窗口关闭", "恢复主机并重新启动 quick-start.cmd"],
            ["历史图片打不开", "output 丢失或恢复不匹配", "恢复同一日期的 data 和 output"],
        ],
        [43 * mm, 50 * mm, 71 * mm],
    ),
    h2("12.1 需要 IT 帮忙时怎么说"),
    p("可以直接把下面这句话发给 IT："),
    code([
        "请允许公司专用网络中的同事电脑，通过主机 DESIGN-PC 的",
        "TCP 8797 端口访问内部 Web 服务；无需公网映射。",
    ]),
    callout("安全提醒", "基础方案使用 HTTP，只适用于受信任、隔离良好的公司内网。共享 Wi-Fi、跨 VLAN 或更高安全要求应由 IT 配置内部 HTTPS。不要自行忽略证书安全警告。", "warn"),
    PageBreak(),
]

# Quick card
story += [
    h1("13. 一页速查卡"),
    h2("管理员最短操作顺序"),
    code([
        "1. 找到设备名称，例如 DESIGN-PC",
        "2. .env：HOST=0.0.0.0",
        "3. .env：PUBLIC_ORIGIN=http://design-pc:8797",
        "4. 防火墙：专用网络放行 TCP 8797",
        "5. 启动 quick-start.cmd",
        "6. 同事测试 http://design-pc:8797/api/health",
        "7. 共享目录放“打开 GuGu AI Visual Studio.url”",
        "8. 审核同事账号并分配积分",
    ]),
    h2("共享目录里可以放"),
    *bullet_list([
        "打开 GuGu AI Visual Studio.url",
        "普通成员使用说明 PDF",
        "管理员联系方式",
    ]),
    h2("共享目录里不能放"),
    *bullet_list([
        "整个 GuGu 程序文件夹",
        ".env、config/settings.json 或 API Key",
        "data/team.db",
        "output 中的团队作品",
        "管理员密码",
    ]),
    callout("记住", "共享文件夹负责“告诉同事从哪里打开”；你的电脑负责“真正运行 GuGu 和保存数据”。", "ok"),
    PageBreak(),
]

# Record page
story += [
    h1("附录：部署信息记录页"),
    p("可打印填写。不要在本页记录密码和 API Key。"),
    grid(
        ["项目", "请填写"],
        [
            ["主机设备名称", "________________________________"],
            ["GuGu 本地目录", "________________________________"],
            ["团队访问地址", "________________________________"],
            ["健康检查地址", "________________________________"],
            ["共享入口位置", "________________________________"],
            ["访问端口", "________________________________"],
            ["管理员用户名", "________________________________"],
            ["维护负责人", "________________________________"],
            ["备份位置", "________________________________"],
            ["首次部署日期", "________________________________"],
            ["最近备份日期", "________________________________"],
        ],
        [52 * mm, 112 * mm],
    ),
    Spacer(1, 7 * mm),
    h2("交接确认"),
    *bullet_list([
        "□ 主机已关闭自动休眠。",
        "□ 防火墙只对专用网络放行 TCP 8797。",
        "□ 同事已通过电脑名称打开 /api/health。",
        "□ 共享目录只有入口和说明，没有团队数据。",
        "□ 已完成普通账号注册、审核、积分和数据隔离测试。",
        "□ 已备份 config、data、output。",
        "□ 管理员密码和 API Key 已存放在公司认可的密码管理位置。",
    ]),
    Spacer(1, 5 * mm),
    p("管理员签字：________________________　日期：________________"),
    p("IT / 交接人签字：____________________　日期：________________"),
    Spacer(1, 8 * mm),
    p("对应版本：GuGu AI Visual Studio 0.1.0 局域网团队版。", "small"),
]


doc = Manual(str(OUTPUT))
doc.multiBuild(story)

meta = OUTPUT.with_suffix(".metadata.pdf")
reader = PdfReader(str(OUTPUT))
writer = PdfWriter()
writer.clone_document_from_reader(reader)
writer.add_metadata({
    "/Title": "GuGu AI Visual Studio 0.1.0 电脑名称访问简化部署手册",
    "/Author": "GuGu AI Visual Studio",
    "/Subject": "通过电脑名称和共享文件夹入口部署 GuGu AI Visual Studio",
})
with meta.open("wb") as stream:
    writer.write(stream)
meta.replace(OUTPUT)
print(OUTPUT)
