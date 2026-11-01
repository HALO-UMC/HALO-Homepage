import { useEffect } from "react";

const META_DESCRIPTION_SELECTOR = 'meta[name="description"]';
const THEME_COLOR_SELECTOR = 'meta[name="theme-color"]';

export default function usePageMeta({ title, description, themeColor }) {
  useEffect(() => {
    const previousTitle = document.title;
    const descriptionMeta = document.querySelector(META_DESCRIPTION_SELECTOR);
    const themeMeta = document.querySelector(THEME_COLOR_SELECTOR);
    const previousDescription = descriptionMeta?.getAttribute("content") ?? "";
    const previousThemeColor = themeMeta?.getAttribute("content") ?? "";

    document.title = title;
    descriptionMeta?.setAttribute("content", description);
    themeMeta?.setAttribute("content", themeColor);

    return () => {
      document.title = previousTitle;
      descriptionMeta?.setAttribute("content", previousDescription);
      themeMeta?.setAttribute("content", previousThemeColor);
    };
  }, [description, themeColor, title]);
}
