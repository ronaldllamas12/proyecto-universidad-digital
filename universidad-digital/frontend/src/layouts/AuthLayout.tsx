import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="container-login" role="main">
      <div className="login-network" aria-hidden="true">
        <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <g className="network-lines network-lines--slow">
            <line x1="40" y1="150" x2="260" y2="110" />
            <line x1="260" y1="110" x2="430" y2="230" />
            <line x1="430" y1="230" x2="690" y2="140" />
            <line x1="690" y1="140" x2="930" y2="260" />
            <line x1="930" y1="260" x2="1140" y2="180" />
            <line x1="180" y1="380" x2="420" y2="320" />
            <line x1="420" y1="320" x2="620" y2="440" />
            <line x1="620" y1="440" x2="850" y2="360" />
            <line x1="850" y1="360" x2="1080" y2="480" />
            <line x1="120" y1="620" x2="340" y2="560" />
            <line x1="340" y1="560" x2="570" y2="680" />
            <line x1="570" y1="680" x2="830" y2="590" />
            <line x1="830" y1="590" x2="1060" y2="710" />
          </g>
          <g className="network-lines network-lines--fast">
            <line x1="60" y1="200" x2="280" y2="340" />
            <line x1="280" y1="340" x2="510" y2="270" />
            <line x1="510" y1="270" x2="760" y2="390" />
            <line x1="760" y1="390" x2="980" y2="320" />
            <line x1="980" y1="320" x2="1150" y2="470" />
            <line x1="220" y1="80" x2="300" y2="260" />
            <line x1="500" y1="140" x2="570" y2="340" />
            <line x1="790" y1="210" x2="860" y2="430" />
            <line x1="1030" y1="170" x2="1090" y2="390" />
            <line x1="190" y1="470" x2="270" y2="670" />
            <line x1="470" y1="520" x2="560" y2="740" />
            <line x1="760" y1="510" x2="830" y2="730" />
          </g>
          <g className="network-nodes">
            <circle cx="40" cy="150" r="4" />
            <circle cx="260" cy="110" r="5" />
            <circle cx="430" cy="230" r="4" />
            <circle cx="690" cy="140" r="5" />
            <circle cx="930" cy="260" r="4" />
            <circle cx="180" cy="380" r="4" />
            <circle cx="420" cy="320" r="5" />
            <circle cx="620" cy="440" r="4" />
            <circle cx="850" cy="360" r="5" />
            <circle cx="120" cy="620" r="4" />
            <circle cx="340" cy="560" r="5" />
            <circle cx="570" cy="680" r="4" />
            <circle cx="830" cy="590" r="5" />
            <circle cx="1060" cy="710" r="4" />
            <circle cx="510" cy="270" r="5" />
            <circle cx="760" cy="390" r="4" />
            <circle cx="980" cy="320" r="5" />
          </g>
        </svg>
      </div>
      <div className="login-wrapper">
        <div className="login-card">
          <header className="titulo-login">
            <h1>Universidad Digital</h1>
            <p>Sistema académico</p>
          </header>
          {children}
        </div>
      </div>
    </main>
  );
}
