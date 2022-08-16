import { useEffect } from "react";
import { useDarkMode } from "usehooks-ts";

export function useTheme() {
  const theme = useDarkMode(false);

  useEffect(() => {
    if (theme.isDarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [theme.isDarkMode]);

  return theme;
}

// <body class="overflow-hidden overscroll-y-contain">
//     <script>
//       if (!!window.localStorage.getItem("usehooks-ts-dark-mode")) {
//         document.body.classList.add("dark");
//       }
//     </script>
// </body>
