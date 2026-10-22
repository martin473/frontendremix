# Frontend Remix

## Seeing every font on your Mac
Firefox doesn't let extensions list installed fonts, so the font picker uses a small
helper (`native/frx_fonts_host.py`) that reads the family names from your font files
(system, /Library/Fonts, ~/Library/Fonts, Font Book downloads, Adobe Fonts).

Set it up once:

    bash ~/frontendremix/native/install.sh

Then reload the extension. The list refreshes every time the popup opens; click
"N fonts on this Mac — rescan" for a deep scan that also finds fonts activated by
font managers. If you move this folder, run the install script again.
