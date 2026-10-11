# Design direction

Quiet drafting desk: a light workspace with a single restrained green accent,
thin dividers and a numbered route in the left rail. The route remains recognizable
without relying on decorative effects. The purpose is direct authoring: screens,
choices, destinations and clear feedback. DFII: impact 4 + fit 5 + feasibility 5 +
performance 5 − consistency risk 4 = 15.

Georgia distinguishes document and step titles. Trebuchet MS with local fallbacks
keeps compact controls readable without remote font requests. CSS variables define
ink, muted text, paper, line, accent and error colors. Spacing uses a small 4–8 px
rhythm with 16–28 px working-area padding. There are no decorative animations.

Desktop uses a compact route list, center image workspace and action inspector.
At narrow widths, explicit Screens/Canvas/Actions buttons select the working panel;
the page scrolls vertically and avoids horizontal overflow. Text actions remain
visible in the player. Primary controls are 44 px at narrow widths and focus has
a solid outline. Native dialogs keep keyboard focus contained and restore it.
