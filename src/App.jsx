import React from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import "./styles.css";

const GlareHover = ({
  width = "500px",
  height = "500px",
  background = "#000",
  borderRadius = "10px",
  borderColor = "#333",
  children,
  glareColor = "#ffffff",
  glareOpacity = 0.5,
  glareAngle = -45,
  glareSize = 250,
  transitionDuration = 650,
  playOnce = false,
  className = "",
  style = {},
}) => {
  const hex = glareColor.replace("#", "");
  let rgba = glareColor;

  if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  } else if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  }

  const vars = {
    "--gh-width": width,
    "--gh-height": height,
    "--gh-bg": background,
    "--gh-br": borderRadius,
    "--gh-angle": `${glareAngle}deg`,
    "--gh-duration": `${transitionDuration}ms`,
    "--gh-size": `${glareSize}%`,
    "--gh-rgba": rgba,
    "--gh-border": borderColor,
  };

  return (
    <div
      className={`glare-hover ${playOnce ? "glare-hover--play-once" : ""} ${className}`}
      style={{ ...vars, ...style }}
    >
      {children}
    </div>
  );
};

function hexToVec3(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uInnerLines;
uniform float uOuterLines;
uniform float uWarpIntensity;
uniform float uRotation;
uniform float uEdgeFadeWidth;
uniform float uColorCycleSpeed;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;
#define HALF_PI 1.5707963
float hashF(float n) { return fract(sin(n * 127.1) * 43758.5453123); }
float smoothNoise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hashF(i), hashF(i + 1.0), u);
}
float displaceA(float coord, float t) {
  float result = sin(coord * 2.123) * 0.2;
  result += sin(coord * 3.234 + t * 4.345) * 0.1;
  result += sin(coord * 0.589 + t * 0.934) * 0.5;
  return result;
}
float displaceB(float coord, float t) {
  float result = sin(coord * 1.345) * 0.3;
  result += sin(coord * 2.734 + t * 3.345) * 0.2;
  result += sin(coord * 0.189 + t * 0.934) * 0.3;
  return result;
}
vec2 rotate2D(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}
void main() {
  vec2 coords = gl_FragCoord.xy / uResolution.xy;
  coords = coords * 2.0 - 1.0;
  coords = rotate2D(coords, uRotation);
  float halfT = uTime * uSpeed * 0.5;
  float fullT = uTime * uSpeed;
  float mouseWarp = 0.0;
  if (uEnableMouse) {
    vec2 mPos = rotate2D(uMouse * 2.0 - 1.0, uRotation);
    float mDist = length(coords - mPos);
    mouseWarp = uMouseInfluence * exp(-mDist * mDist * 4.0);
  }
  float warpAx = coords.x + displaceA(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpAy = coords.y - displaceA(coords.x * cos(fullT) * 1.235, halfT) * uWarpIntensity;
  float warpBx = coords.x + displaceB(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpBy = coords.y - displaceB(coords.x * sin(fullT) * 1.235, halfT) * uWarpIntensity;
  vec2 fieldA = vec2(warpAx, warpAy);
  vec2 fieldB = vec2(warpBx, warpBy);
  vec2 blended = mix(fieldA, fieldB, mix(fieldA, fieldB, 0.5));
  float fadeTop = smoothstep(uEdgeFadeWidth, uEdgeFadeWidth + 0.4, blended.y);
  float fadeBottom = smoothstep(-uEdgeFadeWidth, -(uEdgeFadeWidth + 0.4), blended.y);
  float vMask = 1.0 - max(fadeTop, fadeBottom);
  float tileCount = mix(uOuterLines, uInnerLines, vMask);
  float scaledY = blended.y * tileCount;
  float nY = smoothNoise(abs(scaledY));
  float ridge = pow(step(abs(nY - blended.x) * 2.0, HALF_PI) * cos(2.0 * (nY - blended.x)), 5.0);
  float lines = 0.0;
  for (float i = 1.0; i < 3.0; i += 1.0) {
    lines += pow(max(fract(scaledY), fract(-scaledY)), i * 2.0);
  }
  float pattern = vMask * lines;
  float cycleT = fullT * uColorCycleSpeed;
  float rChannel = (pattern + lines * ridge) * (cos(blended.y + cycleT * 0.234) * 0.5 + 1.0);
  float gChannel = (pattern + vMask * ridge) * (sin(blended.x + cycleT * 1.745) * 0.5 + 1.0);
  float bChannel = (pattern + lines * ridge) * (cos(blended.x + cycleT * 0.534) * 0.5 + 1.0);
  vec3 col = (rChannel * uColor1 + gChannel * uColor2 + bChannel * uColor3) * uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;

function LineWaves({
  speed = 0.3,
  innerLineCount = 32.0,
  outerLineCount = 36.0,
  warpIntensity = 1.0,
  rotation = -45,
  edgeFadeWidth = 0.0,
  colorCycleSpeed = 1.0,
  brightness = 0.2,
  color1 = "#ffffff",
  color2 = "#ffffff",
  color3 = "#ffffff",
  enableMouseInteraction = true,
  mouseInfluence = 2.0,
}) {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (!containerRef.current) return undefined;
    const container = containerRef.current;
    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    let currentMouse = [0.5, 0.5];
    let targetMouse = [0.5, 0.5];

    const rotationRad = (rotation * Math.PI) / 180;
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height] },
        uSpeed: { value: speed },
        uInnerLines: { value: innerLineCount },
        uOuterLines: { value: outerLineCount },
        uWarpIntensity: { value: warpIntensity },
        uRotation: { value: rotationRad },
        uEdgeFadeWidth: { value: edgeFadeWidth },
        uColorCycleSpeed: { value: colorCycleSpeed },
        uBrightness: { value: brightness },
        uColor1: { value: hexToVec3(color1) },
        uColor2: { value: hexToVec3(color2) },
        uColor3: { value: hexToVec3(color3) },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uMouseInfluence: { value: mouseInfluence },
        uEnableMouse: { value: enableMouseInteraction },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    function resize() {
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height];
    }
    function handleMouseMove(e) {
      const rect = gl.canvas.getBoundingClientRect();
      targetMouse = [(e.clientX - rect.left) / rect.width, 1.0 - (e.clientY - rect.top) / rect.height];
    }
    function handleMouseLeave() {
      targetMouse = [0.5, 0.5];
    }

    container.appendChild(gl.canvas);
    window.addEventListener("resize", resize);
    if (enableMouseInteraction) {
      gl.canvas.addEventListener("mousemove", handleMouseMove);
      gl.canvas.addEventListener("mouseleave", handleMouseLeave);
    }
    resize();

    let animationFrameId;
    function update(time) {
      animationFrameId = requestAnimationFrame(update);
      program.uniforms.uTime.value = time * 0.001;
      if (enableMouseInteraction) {
        currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
        currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
        program.uniforms.uMouse.value[0] = currentMouse[0];
        program.uniforms.uMouse.value[1] = currentMouse[1];
      }
      renderer.render({ scene: mesh });
    }
    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      if (enableMouseInteraction) {
        gl.canvas.removeEventListener("mousemove", handleMouseMove);
        gl.canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [speed, innerLineCount, outerLineCount, warpIntensity, rotation, edgeFadeWidth, colorCycleSpeed, brightness, color1, color2, color3, enableMouseInteraction, mouseInfluence]);

  return <div ref={containerRef} className="line-waves-container" />;
}

const experiences = [
  {
    company: "联想集团（北京总部）",
    role: "市场部 · 大客户销售实习生",
    date: "2026.04 - 至今",
    points: ["拆解 KA 客户采购诉求，制定客户触达方案与跟进动作。", "协同产研、设计、业务资源，将定制需求转化为标准化服务流。"],
    detail: "在联想北京总部市场部，我更多承担的是前端业务理解与后端资源协同之间的连接工作。面对大客户复杂的采购节奏和定制化需求，我会先拆解客户行业、采购角色、预算周期与关键决策点，再把宏观市场拓展目标转化为可跟进的触达动作。这个经历让我理解了 B 端业务并不只是销售沟通，更需要产品化地设计信息传递、需求确认、资源响应和后续复盘链路。",
  },
  {
    company: "河南集成供应链管理有限公司",
    role: "商务供应链运营实习生",
    date: "2026.01 - 2026.04",
    points: ["拆解平台入驻机制与流量生态规则，协助制定资源投放策略。", "建立问题反馈机制，将业务协同链路缩短 15%。"],
    detail: "这段经历重点锻炼了我对平台生态规则、商户供需关系和流程体验的理解。我参与拆解主流互联网平台的入驻门槛、资源分发逻辑和商户转化路径，并协助将目标商户画像转化为更清晰的触达策略。在实际推进中，我发现很多效率问题并不来自单点执行，而来自信息反馈链条过长，因此沉淀了标准化问题反馈机制，帮助业务协同链路缩短约 15%。",
  },
  {
    company: "中国工商银行金融部",
    role: "普惠金融信贷运营实习生",
    date: "2025.01 - 2025.03",
    points: ["参与企业信贷资质准入与全周期数据管理。", "优化初审核心量化逻辑，审批资源使用效率提升约 15%。"],
    detail: "在普惠金融信贷运营场景中，我接触到企业资质审核、数据归档、准入判断和审批资源分配等真实业务流程。由于自身具备计量经济学和数据分析背景，我会关注不同变量对初审判断的影响，并尝试从数据完整性、指标解释性和审核效率三个角度优化初筛逻辑。这段经历让我更重视底层数据质量，也让我理解金融业务中的效率提升必须建立在合规与风险控制之上。",
  },
];

const projects = [
  {
    title: "AI 知识管理智能助手",
    meta: "产品策划 / 项目统筹",
    desc: "引入 Kimiz Dalkir 知识管理理论，设计 Chatbot 功能架构与知识流转逻辑，优化前端对话容器体验。",
    stat: "2026.05 - 2026.06",
    tone: "project-a",
    detail: "该项目围绕“如何让用户更高效地沉淀、检索和复用知识”展开。我负责产品策划和项目统筹，先基于 Kimiz Dalkir 知识管理理论梳理知识获取、组织、共享和应用的核心流程，再将其映射为 Chatbot 的功能结构。项目中重点优化了对话容器的信息层级、问题引导、回答反馈和知识流转方式，使 AI 助手不只是问答工具，而是更接近一个能帮助用户持续构建知识资产的产品原型。",
  },
  {
    title: "校园私域用户触达策略",
    meta: "创始人 / 独立操盘手",
    desc: "从 0 到 1 搭建超百人规模私域流量池，建立动态用户标签机制，实现商户需求与个人资源的精准分发。",
    stat: "100+ 私域用户",
    tone: "project-b",
    detail: "这是我在校园场景中独立操盘的从 0 到 1 项目，最初问题来自兼职信息不对称：商户找不到合适学生，学生也很难判断信息是否有效。我搭建了超百人规模的私域流量池，并围绕时间、能力、偏好、地理位置等维度建立动态标签，以便更精准地匹配商户需求和学生资源。后续通过对比图文发布、群发触达和人工推荐的转化反馈，持续优化触达方式和履约链路。",
  },
  {
    title: "农业全产业链数字化研究",
    meta: "量化建模 / 研究负责人",
    desc: "运用计量经济学多元线性回归模型进行复杂数据清洗与量化分析，输出 15,000 字深度研究报告。",
    stat: "15,000 字报告",
    tone: "project-c",
    detail: "该研究聚焦农业全产业链数字化转型路径，我作为负责人统筹选题拆解、资料收集、数据清洗、模型设定和报告输出。研究过程中，我使用计量经济学多元线性回归模型分析不同变量对产业链数字化水平的影响，并将定量结论转化为更容易被业务理解的策略建议。最终形成 15,000 字深度报告，这段经历强化了我把学术方法、数据证据和现实业务问题连接起来的能力。",
  },
];

const strengths = [
  { icon: BrainCircuit, title: "产品设计与触达策略", text: "具备从 0 到 1 业务线操盘经验，能洞察 C 端与 B 端诉求，设计触达产品体验与策略。我的优势不只是提出想法，而是能把用户需求、触达渠道、信息表达和反馈数据连成完整闭环。在校园私域、AI 助手和大客户业务中，我都更关注用户为什么行动、在哪里流失、什么信息能降低决策成本，并据此优化产品或运营方案。" },
  { icon: BarChart3, title: "数据分析与量化建模", text: "熟悉 Excel、Python 数据清洗及多元量化建模，擅长用数据回收验证策略效果。我习惯先明确指标口径，再判断数据是否可靠，最后用模型或对比分析解释业务变化。计量经济学训练让我更重视变量关系、样本质量和结论边界，因此在做策略建议时，我会尽量避免只凭直觉判断，而是用可复盘的数据证据支撑决策。" },
  { icon: Workflow, title: "目标拆解与协同推进", text: "拥有跨团队协同经验，能够把宏观目标拆成可执行动作，推进关键项目敏捷落地。面对复杂任务时，我会先拆出目标、角色、依赖、风险和交付节点，再把不确定问题转化为可讨论、可跟进、可验收的小任务。在联想和供应链实习中，这种结构化推进方式帮助我更快对齐多方诉求，并减少沟通反复。" },
  { icon: Target, title: "高价值客群沟通", text: "在商务与金融场景中沉淀复杂多方沟通能力，兼顾同理心、效率与结果导向。面对高价值客户或多利益相关方时，我会先理解对方真实约束，而不是直接输出方案；再用清晰的信息结构解释可选路径、成本和收益。这种沟通方式让我能在销售、金融审核和运营协同场景中更稳定地推进任务。" },
];

function Header() {
  return (
    <header className="site-header">
      <nav className="nav-left" aria-label="Primary navigation">
        <a href="#hero">首页</a>
        <a href="#profile">个人经历</a>
        <a href="#projects">精选项目</a>
      </nav>
      <a className="brand" href="#hero" aria-label="返回首页">
        <strong>ZHANG CHI</strong>
        <span>HENU 2023</span>
      </a>
      <nav className="nav-right" aria-label="Secondary navigation">
        <a href="#strengths">个人优势</a>
        <a href="#contact">联系方式</a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="hero">
      <video className="hero-video" autoPlay muted loop playsInline poster="https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=2400&q=80">
        <source src="https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_25fps.mp4" type="video/mp4" />
      </video>
      <div className="hero-shade" />
      <Header />
      <div className="hero-frame">
        <div className="hero-labels">
          <span>PRODUCT STRATEGY</span>
          <span>DATA MODELING</span>
          <span>AI WORKFLOW</span>
        </div>
        <h1 className="hero-marquee" aria-label="Product Strategy">
          <span>PRODUCT</span>
          <span>STRATEGY</span>
        </h1>
        <div className="hero-visual" aria-hidden="true">
          <div className="particle-field">
            {Array.from({ length: 46 }).map((_, index) => (
              <i key={index} style={{ "--i": index }} />
            ))}
          </div>
          <div className="orbit-ring ring-one" />
          <div className="orbit-ring ring-two" />
          <div className="hero-status">
            <strong>HENU 2023</strong>
            <span>Strategy / Data / AI</span>
          </div>
        </div>
        <div className="hero-side-note">
          <span>ADAPTIVE LOGIC</span>
          <strong>15%</strong>
          <small>Efficiency Improved</small>
        </div>
        <div className="hero-summary">
          <p>河南大学 2023 级应届生，国际经济与贸易本科在读。关注产品策划、数据分析、AI 知识管理与私域分发策略。</p>
          <div className="hero-actions">
            <a href="#projects" className="primary-action">查看项目 <ArrowUpRight size={18} /></a>
            <a href="mailto:18317798898@163.com" className="ghost-action">联系我</a>
          </div>
        </div>
        <a className="scroll-orb" href="#profile" aria-label="查看个人经历">
          <ArrowUpRight size={24} />
        </a>
      </div>
      <div className="hero-footer">
        <span>GPA 3.6 / 4.0</span>
        <span>3 CORE INTERNSHIPS</span>
        <span>100+ PRIVATE DOMAIN USERS</span>
        <span>15,000 WORD RESEARCH</span>
      </div>
    </section>
  );
}

function Profile() {
  return (
    <section className="section profile-section" id="profile">
      <div className="section-grid">
        <div className="portrait-block">
          <div className="portrait">
            <img className="profile-photo" src="/profile-photo.jpg" alt="张弛个人照片" />
            <div className="scan-line" />
          </div>
        </div>
        <div className="profile-copy">
          <h2>个人经历</h2>
          <p>我目前就读于河南大学高级金融学院国际经济与贸易专业，GPA 3.6 / 4.0。经历覆盖大客户销售、供应链运营、普惠金融信贷运营与 AI 产品策划，偏好用结构化拆解把复杂目标变成清晰动作。</p>
          <div className="contact-grid">
            <span><MapPin size={18} /> 河南省郑州市金水区</span>
            <span><Phone size={18} /> 18317798898</span>
            <span><Mail size={18} /> 18317798898@163.com</span>
            <span><BriefcaseBusiness size={18} /> 产品策划 / 商业分析 / 运营策略</span>
          </div>
          <div className="metrics">
            <div><strong>3</strong><span>段核心企业实习</span></div>
            <div><strong>15%</strong><span>流程或资源效率提升</span></div>
            <div><strong>100+</strong><span>校园私域用户池</span></div>
            <div><strong>15k</strong><span>研究报告字数</span></div>
          </div>
        </div>
      </div>
      <div className="timeline">
        {experiences.map((item) => (
          <GlareHover
            key={item.company}
            className="timeline-item"
            width="100%"
            height="100%"
            background="rgba(15, 22, 30, 0.72)"
            borderRadius="18px"
            borderColor="rgba(212, 233, 255, 0.14)"
            glareColor="#6df0d2"
            glareOpacity={0.28}
            glareAngle={-30}
            glareSize={260}
            transitionDuration={780}
          >
            <details className="card-details">
              <summary>
                <div className="timeline-head">
                  <time>{item.date}</time>
                  <h3>{item.company}</h3>
                  <p>{item.role}</p>
                </div>
              </summary>
              <ul>{item.points.map((point) => <li key={point}>{point}</li>)}</ul>
              <p className="expanded-copy">{item.detail}</p>
            </details>
          </GlareHover>
        ))}
      </div>
    </section>
  );
}

function Projects() {
  return (
    <section className="section projects-section" id="projects">
      <div className="section-title">
        <h2>精选项目</h2>
        <p>以产品化思维组织问题，用数据和反馈修正策略。</p>
      </div>
      <div className="project-grid">
        {projects.map((project) => (
          <GlareHover
            className={`project-card ${project.tone}`}
            key={project.title}
            width="100%"
            height="100%"
            background="rgba(18, 28, 38, 0.92)"
            borderRadius="18px"
            borderColor="rgba(212, 233, 255, 0.14)"
            glareColor="#ffffff"
            glareOpacity={0.22}
            glareAngle={-30}
            glareSize={280}
            transitionDuration={820}
          >
            <details className="card-details">
              <summary>
                <div className="project-art">
                  <div className="orbital" />
                  <Sparkles size={24} />
                </div>
                <div className="project-info">
                  <span>{project.meta}</span>
                  <h3>{project.title}</h3>
                  <strong>{project.stat}</strong>
                </div>
              </summary>
              <p className="project-detail">{project.detail}</p>
            </details>
          </GlareHover>
        ))}
      </div>
    </section>
  );
}

function Strengths() {
  return (
    <section className="section strengths-section" id="strengths">
      <div className="section-title compact">
        <h2>个人优势</h2>
        <p>能力不是标签，而是能持续交付结果的工作方式。</p>
      </div>
      <div className="strength-grid">
        {strengths.map(({ icon: Icon, title, text }) => (
          <GlareHover
            className="strength-card"
            key={title}
            width="100%"
            height="100%"
            background="rgba(15, 22, 30, 0.72)"
            borderRadius="18px"
            borderColor="rgba(212, 233, 255, 0.14)"
            glareColor="#6df0d2"
            glareOpacity={0.26}
            glareAngle={-30}
            glareSize={260}
            transitionDuration={760}
          >
            <details className="card-details">
              <summary>
                <div className="strength-head">
                  <Icon size={28} />
                  <h3>{title}</h3>
                </div>
              </summary>
              <p>{text}</p>
            </details>
          </GlareHover>
        ))}
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section className="contact-section" id="contact">
      <div className="contact-inner">
        <h2>期待把新的问题，拆成漂亮的解决方案。</h2>
        <p>欢迎联系我交流产品、运营、数据分析或 AI 工作流相关机会。</p>
        <div className="contact-links">
          <a href="mailto:18317798898@163.com"><Mail size={20} /> 18317798898@163.com</a>
          <a href="tel:18317798898"><Phone size={20} /> 18317798898</a>
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <>
      <div className="global-waves" aria-hidden="true">
        <LineWaves
          speed={0.22}
          innerLineCount={34}
          outerLineCount={42}
          warpIntensity={0.85}
          rotation={-38}
          edgeFadeWidth={0.08}
          colorCycleSpeed={0.55}
          brightness={0.18}
          color1="#6df0d2"
          color2="#8fb7ff"
          color3="#ffffff"
          enableMouseInteraction={true}
          mouseInfluence={1.35}
        />
      </div>
      <Hero />
      <Profile />
      <Projects />
      <Strengths />
      <Contact />
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
