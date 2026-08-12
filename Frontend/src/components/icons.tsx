import type { ReactNode, SVGProps } from "react";

/**
 * Small, dependency-free line-icon set (Heroicons-outline-style paths) used
 * throughout the app in place of emoji, for a consistent, crisp look across
 * platforms/fonts.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, className = "h-5 w-5", ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconHome = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
  </Icon>
);

export const IconLibrary = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 4v16M9 4v16M9 4l6 1v15l-6-1M19 6l-4-1v16l4 1V6Z" />
  </Icon>
);

export const IconClipboard = (props: IconProps) => (
  <Icon {...props}>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M9 11h6M9 15h6" />
  </Icon>
);

export const IconBookOpen = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 6c-1.5-1.3-3.6-2-6-2H4v14h2c2.4 0 4.5.7 6 2 1.5-1.3 3.6-2 6-2h2V4h-2c-2.4 0-4.5.7-6 2Z" />
    <path d="M12 6v14" />
  </Icon>
);

export const IconClock = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Icon>
);

export const IconAlertClock = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4M9 3h6M12 13h.01" />
  </Icon>
);

export const IconHourglass = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 3h12M6 21h12M7 3c0 4 3 5 5 6-2 1-5 2-5 6M17 3c0 4-3 5-5 6 2 1 5 2 5 6" />
  </Icon>
);

export const IconCurrencyDollar = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6.5v11M15 9.2c0-1.2-1.3-2.2-3-2.2s-3 1-3 2.4c0 3 6 1.6 6 4.6 0 1.4-1.3 2.4-3 2.4s-3-1-3-2.2" />
  </Icon>
);

export const IconUser = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20c1.4-3.5 4.3-5.5 7.5-5.5s6.1 2 7.5 5.5" />
  </Icon>
);

export const IconUsers = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="9" cy="8" r="3" />
    <path d="M2.5 19c1.1-2.8 3.4-4.5 6.5-4.5s5.4 1.7 6.5 4.5" />
    <circle cx="17" cy="8.5" r="2.3" />
    <path d="M15.5 14.7c1.9.4 3.5 1.9 4.3 4.3" />
  </Icon>
);

export const IconTag = (props: IconProps) => (
  <Icon {...props}>
    <path d="M11.5 3H5a2 2 0 0 0-2 2v6.5a2 2 0 0 0 .6 1.4l8.5 8.5a2 2 0 0 0 2.8 0l6.5-6.5a2 2 0 0 0 0-2.8l-8.5-8.5a2 2 0 0 0-1.4-.6Z" />
    <circle cx="8" cy="8" r="1.5" />
  </Icon>
);

export const IconRefresh = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 4v5h5M20 20v-5h-5" />
    <path d="M5.5 15a7.5 7.5 0 0 0 13-3.5M18.5 9a7.5 7.5 0 0 0-13 3.5" />
  </Icon>
);

export const IconChartBar = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 20V10M12 20V4M19 20v-7" />
    <path d="M3 20h18" />
  </Icon>
);

export const IconCog = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4.7a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.3a7 7 0 0 0-2 1.2l-2.4-.7-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-.7a7 7 0 0 0 2 1.2L10 21h4l.5-2.3a7 7 0 0 0 2-1.2l2.4.7 2-3.4-2-1.6c.07-.4.1-.8.1-1.2Z" />
  </Icon>
);

export const IconDocumentText = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v4h4M9 12h6M9 16h6" />
  </Icon>
);

export const IconDocument = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v4h4" />
  </Icon>
);

export const IconWrench = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2 2.8-2.8Z" />
  </Icon>
);

export const IconBookmark = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 3.5h12a.5.5 0 0 1 .5.5v16.3a.5.5 0 0 1-.77.4L12 16.5l-5.73 4.2a.5.5 0 0 1-.77-.4V4a.5.5 0 0 1 .5-.5Z" />
  </Icon>
);

export const IconSun = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </Icon>
);

export const IconMoon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
  </Icon>
);

export const IconBell = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Icon>
);

export const IconEye = (props: IconProps) => (
  <Icon {...props}>
    <path d="M2.5 12S5.5 5.5 12 5.5 21.5 12 21.5 12 18.5 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.75" />
  </Icon>
);

export const IconEyeOff = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6.5 0 9.5 6.5 9.5 6.5a15 15 0 0 1-3.4 4.3M6.3 7.3A14.6 14.6 0 0 0 2.5 12S5.5 18.5 12 18.5a9.6 9.6 0 0 0 3.2-.5" />
    <path d="M9.5 9.8a2.75 2.75 0 0 0 3.9 3.9" />
  </Icon>
);

export const IconPanelLeft = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <path d="M9.5 4.5v15" />
  </Icon>
);

export const IconX = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const IconCheck = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.3l2.4 2.4 4.6-5.4" />
  </Icon>
);

export const IconXCircle = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
  </Icon>
);

export const IconExternalLink = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 6H6a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 6 19h10a1.5 1.5 0 0 0 1.5-1.5V15" />
    <path d="M14 4h6v6M20 4l-9.5 9.5" />
  </Icon>
);
