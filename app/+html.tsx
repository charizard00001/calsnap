import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/*
          viewport-fit=cover is what lets the app paint under the Dynamic
          Island and the home indicator; without it iOS letterboxes the page
          and you get pale bands top and bottom. maximum-scale + user-scalable
          stop Safari zooming the whole layout when a text input takes focus.
        */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        {/* Paints Safari's own chrome to match, so the app has no seam at either end. */}
        <meta name="theme-color" content="#0B0B10" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CalSnap" />

        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: rootStyles }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const rootStyles = `
:root { color-scheme: dark; }

html, body {
  margin: 0;
  padding: 0;
  background-color: #0B0B10;
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: transparent;
}

/*
  iOS Safari's toolbars grow and shrink as you scroll, so 100vh is taller
  than what you can actually see and the bottom of the app gets cut off.
  100dvh tracks the visible viewport; -webkit-fill-available is the fallback
  for older iOS, and the plain 100% keeps everything else honest.
*/
html, body, #root {
  height: 100%;
  height: -webkit-fill-available;
  height: 100dvh;
}

body {
  overflow: hidden;
  /* Kills the rubber-band overscroll that would flash the page background
     past the ends of a list. */
  overscroll-behavior: none;
}

#root {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Momentum scrolling inside RN ScrollViews, without a visible scrollbar. */
* { -webkit-overflow-scrolling: touch; }
::-webkit-scrollbar { width: 0; height: 0; }

/* Text inputs must never be under 16px on iOS or Safari zooms on focus. */
input, textarea, select { font-size: 16px; }
`;
