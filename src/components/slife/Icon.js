import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { COLORS } from '../../globalStyle/Theme';

const strokeProps = (color, strokeWidth) => ({
  stroke: color,
  strokeWidth,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
});

const wrap =
  (paths) =>
  ({ size = 24, color = COLORS.foreground, strokeWidth = 1.5, style }) =>
    (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
        {paths(color, strokeWidth)}
      </Svg>
    );

const Icon = {
  Home: wrap((c, w) => (
    <Path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" {...strokeProps(c, w)} />
  )),
  Search: wrap((c, w) => (
    <>
      <Circle cx="11" cy="11" r="7" {...strokeProps(c, w)} />
      <Path d="M20 20l-3.5-3.5" {...strokeProps(c, w)} />
    </>
  )),
  Users: wrap((c, w) => (
    <>
      <Path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" {...strokeProps(c, w)} />
      <Circle cx="10" cy="7" r="4" {...strokeProps(c, w)} />
      <Path d="M22 21v-2a4 4 0 0 0-3-3.87" {...strokeProps(c, w)} />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" {...strokeProps(c, w)} />
    </>
  )),
  Message: wrap((c, w) => (
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...strokeProps(c, w)} />
  )),
  User: wrap((c, w) => (
    <>
      <Circle cx="12" cy="8" r="4" {...strokeProps(c, w)} />
      <Path d="M4 21v-1a7 7 0 0 1 16 0v1" {...strokeProps(c, w)} />
    </>
  )),
  Bell: wrap((c, w) => (
    <>
      <Path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" {...strokeProps(c, w)} />
      <Path d="M10 21a2 2 0 0 0 4 0" {...strokeProps(c, w)} />
    </>
  )),
  ArrowLeft: wrap((c, w) => (
    <>
      <Path d="M19 12H5" {...strokeProps(c, w)} />
      <Path d="M12 19l-7-7 7-7" {...strokeProps(c, w)} />
    </>
  )),
  ArrowRight: wrap((c, w) => (
    <>
      <Path d="M5 12h14" {...strokeProps(c, w)} />
      <Path d="M12 5l7 7-7 7" {...strokeProps(c, w)} />
    </>
  )),
  Check: wrap((c, w) => <Path d="M20 6L9 17l-5-5" {...strokeProps(c, w)} />),
  Close: wrap((c, w) => <Path d="M18 6L6 18M6 6l12 12" {...strokeProps(c, w)} />),
  Filter: wrap((c, w) => <Path d="M4 5h16M6 12h12M10 19h4" {...strokeProps(c, w)} />),
  Lock: wrap((c, w) => (
    <>
      <Rect x="4" y="10" width="16" height="11" rx="1" {...strokeProps(c, w)} />
      <Path d="M8 10V7a4 4 0 1 1 8 0v3" {...strokeProps(c, w)} />
    </>
  )),
  Chevron: wrap((c, w) => <Path d="M9 6l6 6-6 6" {...strokeProps(c, w)} />),
  ChevronDown: wrap((c, w) => <Path d="M6 9l6 6 6-6" {...strokeProps(c, w)} />),
  Upload: wrap((c, w) => (
    <>
      <Path d="M12 3v13" {...strokeProps(c, w)} />
      <Path d="M6 9l6-6 6 6" {...strokeProps(c, w)} />
      <Path d="M4 21h16" {...strokeProps(c, w)} />
    </>
  )),
  Plus: wrap((c, w) => <Path d="M12 5v14M5 12h14" {...strokeProps(c, w)} />),
  Camera: wrap((c, w) => (
    <>
      <Path
        d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"
        {...strokeProps(c, w)}
      />
      <Circle cx="12" cy="14" r="4" {...strokeProps(c, w)} />
    </>
  )),
  Send: wrap((c, w) => <Path d="M4 12l16-8-6 18-3-7z" {...strokeProps(c, w)} />),
  Attach: wrap((c, w) => (
    <Path
      d="M21 12l-8.5 8.5a5 5 0 1 1-7-7L14 5a3.5 3.5 0 1 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 8"
      {...strokeProps(c, w)}
    />
  )),
  Mic: wrap((c, w) => (
    <>
      <Rect x="9" y="3" width="6" height="12" rx="3" {...strokeProps(c, w)} />
      <Path d="M5 11a7 7 0 0 0 14 0" {...strokeProps(c, w)} />
      <Path d="M12 18v3" {...strokeProps(c, w)} />
    </>
  )),
  Doc: wrap((c, w) => (
    <>
      <Path
        d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
        {...strokeProps(c, w)}
      />
      <Path d="M15 3v5h5" {...strokeProps(c, w)} />
    </>
  )),
  Calendar: wrap((c, w) => (
    <>
      <Rect x="3" y="5" width="18" height="16" rx="1" {...strokeProps(c, w)} />
      <Path d="M3 10h18M8 3v4M16 3v4" {...strokeProps(c, w)} />
    </>
  )),
  DotsV: wrap((c, w) => (
    <>
      <Circle cx="12" cy="5" r="1" fill={c} stroke="none" />
      <Circle cx="12" cy="12" r="1" fill={c} stroke="none" />
      <Circle cx="12" cy="19" r="1" fill={c} stroke="none" />
    </>
  )),
  Settings: wrap((c, w) => (
    <>
      <Circle cx="12" cy="12" r="3" {...strokeProps(c, w)} />
      <Path
        d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.6A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2 1.6 2 3.4 2.4-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.5a7 7 0 0 0 2-1.2l2.4.9 2-3.4-2-1.6A7 7 0 0 0 19 12z"
        {...strokeProps(c, w)}
      />
    </>
  )),
  Sparkle: wrap((c, w) => <Path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" {...strokeProps(c, w)} />),
  Globe: wrap((c, w) => (
    <>
      <Circle cx="12" cy="12" r="9" {...strokeProps(c, w)} />
      <Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" {...strokeProps(c, w)} />
    </>
  )),
  Instagram: wrap((c, w) => (
    <>
      <Rect x="3" y="3" width="18" height="18" rx="4" {...strokeProps(c, w)} />
      <Circle cx="12" cy="12" r="4" {...strokeProps(c, w)} />
      <Circle cx="17.5" cy="6.5" r="0.5" fill={c} stroke="none" />
    </>
  )),
  Pin: wrap((c, w) => (
    <>
      <Path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z" {...strokeProps(c, w)} />
      <Circle cx="12" cy="10" r="2.5" {...strokeProps(c, w)} />
    </>
  )),
  Building: wrap((c, w) => (
    <>
      <Rect x="4" y="3" width="16" height="18" {...strokeProps(c, w)} />
      <Path d="M8 7h2M8 11h2M8 15h2M14 7h2M14 11h2M14 15h2" {...strokeProps(c, w)} />
    </>
  )),
  LinkedIn: ({ size = 20, style }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Path
        fill="#0A66C2"
        d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7c.54-.9 1.87-1.9 3.85-1.9 4.12 0 4.88 2.7 4.88 6.2V21h-4v-5.3c0-1.27 0-2.9-1.77-2.9-1.77 0-2.05 1.38-2.05 2.8V21h-4z"
      />
    </Svg>
  ),
  Facebook: ({ size = 20, style }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Path
        fill="#1877F2"
        d="M22 12a10 10 0 1 0-11.56 9.87V14.9H7.9V12h2.54V9.8c0-2.5 1.5-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.9h-2.33v6.97A10 10 0 0 0 22 12z"
      />
    </Svg>
  ),
  Shield: wrap((c, w) => (
    <>
      <Path
        d="M12 2l2.5 2.5L18 4l1 3.5 3 1L21 12l1 3.5-3 1L18 20l-3.5-.5L12 22l-2.5-2.5L6 20l-1-3.5-3-1L3 12 2 8.5l3-1L6 4l3.5.5z"
        {...strokeProps(c, w)}
      />
    </>
  )),
};

export default Icon;
