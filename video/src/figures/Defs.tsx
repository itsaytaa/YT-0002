// Shared SVG filters and gradients. Mounted once per SVG scene.
import React from "react";
import { C } from "../theme";

export const Defs: React.FC = () => (
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="b" />
      <feFlood floodColor="#EEF1F4" floodOpacity="0.35" />
      <feComposite in2="b" operator="in" result="g" />
      <feMerge>
        <feMergeNode in="g" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="glowSoft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="b" />
      <feFlood floodColor="#EEF1F4" floodOpacity="0.18" />
      <feComposite in2="b" operator="in" result="g" />
      <feMerge>
        <feMergeNode in="g" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="glowBlue" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="b" />
      <feFlood floodColor={C.blue} floodOpacity="0.55" />
      <feComposite in2="b" operator="in" result="g" />
      <feMerge>
        <feMergeNode in="g" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="glowRed" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="b" />
      <feFlood floodColor={C.red} floodOpacity="0.5" />
      <feComposite in2="b" operator="in" result="g" />
      <feMerge>
        <feMergeNode in="g" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    {/* 3 px red outline around a silhouette (plus the usual glow on the figure). */}
    <filter id="outlineRed" x="-20%" y="-20%" width="140%" height="140%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="7" result="d1" />
      <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="d0" />
      <feComposite in="d1" in2="d0" operator="out" result="ring" />
      <feFlood floodColor={C.red} />
      <feComposite in2="ring" operator="in" result="redRing" />
      <feGaussianBlur in="redRing" stdDeviation="4" result="redGlow" />
      <feMerge>
        <feMergeNode in="redGlow" />
        <feMergeNode in="redRing" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="30" />
    </filter>
    <filter id="bloomBig" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="70" />
    </filter>
    <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="2" />
    </filter>
  </defs>
);
