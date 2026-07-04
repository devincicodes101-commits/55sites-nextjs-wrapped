import { getSiteConfig } from "@/lib/sites/registry";

// Injects the site's brand colours as CSS custom properties so every
// component in globals.css (which only references var(--p) etc.) picks up
// the right palette for this config without any component-level changes.
export default function ThemeStyle() {
  const { primary, secondary, accent, dark, bg } = getSiteConfig().theme;
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root{--p:${primary};--s:${secondary};--a:${accent};--d:${dark};--bg:${bg}}`,
      }}
    />
  );
}
