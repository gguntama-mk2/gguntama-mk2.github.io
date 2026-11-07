#!/usr/bin/env python3
"""Build a same-origin, GitHub-Pages-compatible PROJECT T release candidate.

NEVER publish automatically. Main/production remains untouched.
Build output: phase11-pages-package/site and phase11-pages-package/site.zip.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import zipfile

SOURCE = Path("test-litev1")
ROOT_COPY = (
    ".nojekyll", "CNAME", "about.html", "admin-cloud-analysis.js",
    "admin-move-icons.js", "admin-move-media.js", "admin.html", "admin.js",
    "ads.txt", "apple-touch-icon.png", "checksheet-base.json",
    "combos-live.json", "favicon-32.png", "favicon.svg", "index.html",
    "move-icons.js", "move-media.js", "privacy.html", "terms.html"
)
ASSET_DIRS = ("css", "js", "media", "pxstore")
EXCLUDE_JS = {"pt-preview-guard.js", "pt-move-media-preview.js"}
CHARACTER_RE = re.compile(r"^[a-z0-9-]+\.json$")
STATIC_HTML_LINK = re.compile(
    r'((?:src|href)=["\'])(assets/(?:js|css)/[^"\'?]+|move-icons\.js|move-media\.js)(["\'])'
)
HTML_ATTR_LINK = re.compile(r'(?:src|href)=["\']([^"\']+)["\']')


def sha(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def verify_rel_path(root: Path, relative: str) -> None:
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()) or not path.is_file():
        raise AssertionError(f"Missing or unsafe reference: {relative}")


def prepare_html(s: str, device: str, version: str) -> str:
    assert "<head>" in s and "<body>" in s
    assert s.count('src="assets/js/pt-preview-guard.js"') == 1
    assert s.count('src="move-media-preview.js"') == 1
    assert s.count('src="move-icons.js"') == 1
    s = re.sub(r'<meta\s+name="robots"\s+content="noindex,nofollow,noarchive"\s*/?>\s*', '', s)
    s = re.sub(r'<script\s+src="assets/js/pt-preview-guard.js"></script>\s*', '', s)
    s = s.replace('src="move-media-preview.js"', 'src="move-media.js"')
    assert 'pt-preview-guard' not in s and 'move-media-preview' not in s and 'noindex' not in s
    s = s.replace("<head>", '<head>\n<script>window.PT_ASSET_VERSION="' + version + '";</script>', 1)
    s = STATIC_HTML_LINK.sub(lambda m: m.group(1) + m.group(2) + "?v=" + version + m.group(3), s)
    assert 'src="move-media.js?v=' + version + '"' in s
    assert 'src="move-icons.js?v=' + version + '"' in s
    assert 'src="assets/js/' + device + '_route-loader.js?v=' + version + '"' in s
    return s


def prepare_js(text: str, name: str) -> str:
    if name in ("pc_route-loader.js", "sp_route-loader.js"):
        old = 'node.src=prefix+code+".js";'
        assert text.count(old) == 1, ("unrecognized loader", name)
        text = text.replace(old, 'node.src=prefix+code+".js?v="+encodeURIComponent(window.PT_ASSET_VERSION||"1");')
    if name in ("pc_04.js", "sp_04.js"):
        old = 'const url="assets/data/characters/"+encodeURIComponent(c.id)+".json";'
        assert text.count(old) == 1, ("unrecognized character loader", name)
        text = text.replace(old, 'const url="assets/data/characters/"+encodeURIComponent(c.id)+".json?v="+encodeURIComponent(window.PT_ASSET_VERSION||"1");')
    return text


def build(output: Path) -> dict:
    if not SOURCE.is_dir():
        raise FileNotFoundError(SOURCE)
    if output.resolve() in (Path(".").resolve(), SOURCE.resolve()):
        raise RuntimeError("Must use isolated phase11 output path")
    if output.exists():
        shutil.rmtree(output)
    site = output / "site"
    site.mkdir(parents=True)
    # Only whitelisted production root files; avoid shipping preview/test helper documents.
    for name in ROOT_COPY:
        src = Path(name)
        verify_rel_path(Path("."), name)
        shutil.copy2(src, site / name)
    # Publish exactly production runtime assets, excluding all diagnostic data and mocks.
    for directory in ASSET_DIRS:
        srcdir = SOURCE / "assets" / directory
        if not srcdir.is_dir():
            raise AssertionError(f"missing {srcdir}")
        dest = site / "assets" / directory
        dest.mkdir(parents=True)
        for p in srcdir.rglob("*"):
            if not p.is_file():
                continue
            if directory == "js" and p.name in EXCLUDE_JS:
                continue
            rel = p.relative_to(srcdir)
            target = dest / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            if directory == "js" and p.suffix == ".js":
                target.write_text(prepare_js(p.read_text("utf-8"), p.name), "utf-8")
            else:
                shutil.copy2(p, target)
    chars = list((SOURCE / "assets/data/characters").glob("*.json"))
    assert len(chars) == 44, ("expected 44 characters", len(chars))
    for p in chars:
        assert CHARACTER_RE.fullmatch(p.name), p
        target = site / "assets" / "data" / "characters" / p.name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, target)
    try:
        version = subprocess.check_output(["git", "rev-parse", "--short=12", "HEAD"], text=True).strip()
    except Exception:
        version = "local-20261107"
    assert re.fullmatch(r"[A-Za-z0-9-]+", version)
    for device in ("pc", "sp"):
        html = prepare_html((SOURCE / (device + ".html")).read_text("utf-8"), device, version)
        (site / (device + ".html")).write_text(html, "utf-8")
    # The source homepage still advertised its old 50MB monolithic HTML. The
    # new bundle uses lazy files, so remove the misleading initial-load warning.
    index = (site / "index.html").read_text("utf-8")
    index = index.replace("初回のみ、約50MB", "必要なファイルのみ順番に読み込みます")
    (site / "index.html").write_text(index, "utf-8")
    for icon in Path("icons").glob("*.webp"):
        target = site / icon.relative_to(Path("."))
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(icon, target)
    icon_count = len(list((site / "icons").glob("*.webp")))
    assert icon_count == 15, ("expected 15 icons", icon_count)
    # No preview login interception, test-only robots policy, or external data
    # relay may be a dependency of a production candidate.
    assert not (site / "assets/js/pt-preview-guard.js").exists()
    assert not (site / "assets/js/pt-move-media-preview.js").exists()
    assert not (site / "move-media-preview.js").exists()
    assert (site / "move-media.js").read_text("utf-8").find("/api/v1/move-media") >= 0
    assert (site / "move-icons.js").read_text("utf-8").find("/api/v1/move-icons") >= 0
    for dev in ("pc", "sp"):
        html = (site / (dev + ".html")).read_text("utf-8")
        for link in HTML_ATTR_LINK.findall(html):
            if link.startswith(("http:", "https:", "//", "data:", "#", "mailto:", "javascript:")):
                continue
            ref = link.split("?", 1)[0].split("#", 1)[0]
            if ref:
                verify_rel_path(site, ref)
        assert not any(bad in html for bad in ("githubraw.com", "raw.githubusercontent.com", "__PROJECT_T_PREVIEW", "noindex"))
        assert (site / (dev + ".html")).stat().st_size < 100_000
    # Check all linked payloads and produce a stable SHA256 inventory for later rollback.
    files = sorted(p for p in site.rglob("*") if p.is_file())
    records = [{"path":p.relative_to(site).as_posix(), "bytes":p.stat().st_size, "sha256":sha(p)} for p in files]
    total = sum(x["bytes"] for x in records)
    assert total < 1_000_000_000
    assert len(records) >= 450
    assert not any(item["path"].startswith("assets/data/phase") for item in records)
    result = {
        "schema": 11, "mode": "unpublished-github-pages-release-candidate",
        "version": version, "root": "site", "total_files": len(records),
        "total_bytes": total, "character_count": len(chars),
        "icon_count": icon_count, "html_bytes": {
            x: (site / (x + ".html")).stat().st_size for x in ("pc", "sp")
        },
        "source_monolith_bytes": {
            x: Path(x + ".html").stat().st_size for x in ("pc", "sp")
        },
        "external_proxy_required": False,
        "rollback_target": "current main SHA, preserve existing site files until explicit approval",
        "payloads": records,
    }
    (output / "manifest.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", "utf-8")
    bundle = output / "project-t-pages-phase11.zip"
    with zipfile.ZipFile(bundle, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for p in files:
            archive.write(p, arcname=p.relative_to(site).as_posix())
    result["zip_bytes"] = bundle.stat().st_size
    print(json.dumps({k:v for k,v in result.items() if k!="payloads"}, ensure_ascii=False, indent=2))
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="phase11-pages-package")
    args = parser.parse_args()
    build(Path(args.out))
