import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { Lab } from "./Lab";
import { EPISODES } from "./episodes";
import { CharacterSheet, PropSheet, LayoutSheet, CardSheet } from "./sheets/Sheets";

// One Advisory-<id> and Thumbnail-<id> composition per registered episode, plus the
// brand reference sheets (rendered to brand/reference/ by scripts/reference.mjs).
export const RemotionRoot: React.FC = () => (
  <>
    {Object.entries(EPISODES).map(([id, { episode, Thumbnail }]) => (
      <React.Fragment key={id}>
        <Composition
          id={`Advisory-${id}`}
          component={Video}
          defaultProps={{ ep: id }}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={episode.timings.totalFrames}
        />
        <Composition id={`Thumbnail-${id}`} component={Thumbnail} width={1280} height={720} fps={30} durationInFrames={1} />
      </React.Fragment>
    ))}
    <Composition id="Sheet-Characters" component={CharacterSheet} width={1920} height={1080} fps={30} durationInFrames={1} />
    <Composition id="Sheet-Props" component={PropSheet} width={1920} height={1080} fps={30} durationInFrames={1} />
    <Composition id="Sheet-Layout" component={LayoutSheet} width={1920} height={1080} fps={30} durationInFrames={1} />
    <Composition id="Sheet-Cards" component={CardSheet} width={1920} height={1080} fps={30} durationInFrames={1} />
    <Composition id="Lab" component={Lab} width={1920} height={1080} fps={30} durationInFrames={30} />
  </>
);
