"""Version local CSS/JS URLs in staged HTML without changing source pages."""

import argparse
import hashlib
from pathlib import Path


def version_assets(site: Path) -> None:
    assets = ("style.css", "community.css", "main.js")
    pages = ("index.html", "members.html", "events.html", "experiences.html")
    versions = {
        name: hashlib.sha256((site / name).read_bytes()).hexdigest()[:16]
        for name in assets
    }
    staged_pages = {}
    for name in pages:
        page = site / name
        html = page.read_text(encoding="utf-8")
        for asset, version in versions.items():
            reference = f'"./{asset}"'
            if html.count(reference) != 1:
                raise ValueError(f"Expected one {asset} reference in {name}")
            html = html.replace(reference, f'"./{asset}?v={version}"')
        staged_pages[page] = html

    for page, html in staged_pages.items():
        page.write_text(html, encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site", type=Path, help="Directory containing the staged site")
    version_assets(parser.parse_args().site)
