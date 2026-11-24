# Genere le blog de hayaiptv.com a partir des fichiers .html de ce dossier.
# Format d'un article : ligne 1 titre, 2 description, 3 slug, 4 date (AAAA-MM-JJ), 5 emoji, puis le contenu HTML.
# Utilisation : powershell -File hayaiptv-blog-src\build-blog.ps1
$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot
$out = Join-Path (Split-Path $src -Parent) 'hayaiptv-demo\blog'
New-Item -ItemType Directory -Force $out | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding $false
$V = '9'

function Esc([string]$s) { return $s.Replace('&','&amp;').Replace('"','&quot;').Replace('<','&lt;').Replace('>','&gt;') }

$head = @'
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}} | HayaIPTV</title>
  <meta name="description" content="{{DESC}}">
  <link rel="canonical" href="{{URL}}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#05070f">
  <meta property="og:type" content="{{OGTYPE}}">
  <meta property="og:site_name" content="HayaIPTV">
  <meta property="og:title" content="{{TITLE}}">
  <meta property="og:description" content="{{DESC}}">
  <meta property="og:url" content="{{URL}}">
  <meta property="og:image" content="https://hayaiptv.com/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <script>try { const t = localStorage.getItem("haya-theme"); if (t) document.documentElement.dataset.theme = t; } catch (e) {}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
  <link rel="stylesheet" href="/style.css?v={{V}}">
  <link rel="icon" href="/logo.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <script type="application/ld+json">{{LD}}</script>
  <style>
    .page { padding: 130px 0 70px; }
    .article { max-width: 760px; margin: 0 auto; }
    .article h1 { font-size: clamp(1.9rem, 4.5vw, 2.8rem); letter-spacing: -.03em; line-height: 1.15; margin: 12px 0 10px; }
    .article h2 { font-size: 1.45rem; margin: 38px 0 12px; letter-spacing: -.01em; }
    .article p, .article li { line-height: 1.75; font-size: 1.04rem; }
    .article li { margin-bottom: 6px; }
    .article a { color: var(--brand-2); }
    .article .table-wrap { margin: 16px 0; }
    .meta { color: var(--muted); font-size: .88rem; }
    .callout { margin: 30px 0; padding: 18px 20px; border-radius: 16px; background: var(--surface); border: 1px solid var(--line); border-left: 4px solid var(--brand); line-height: 1.7; }
    .cta-end { margin: 44px 0 0; padding: 26px; border-radius: 20px; text-align: center; background: radial-gradient(60% 120% at 50% 0%, rgba(124,92,255,.3), transparent 70%), var(--bg2); border: 1px solid var(--line); }
    .cta-end h2 { margin: 0 0 8px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 26px; }
    .card { display: grid; gap: 8px; padding: 22px; border-radius: 18px; background: var(--surface); border: 1px solid var(--line); text-decoration: none; color: inherit; transition: transform .2s, border-color .2s; }
    .card:hover { transform: translateY(-3px); border-color: var(--brand); }
    .card .em { font-size: 2rem; }
    .card b { font-size: 1.08rem; line-height: 1.35; }
    .card span { color: var(--muted); font-size: .9rem; line-height: 1.55; }
  </style>
</head>
<body>
<header class="top scrolled">
  <nav class="wrap nav" aria-label="Navigation principale">
    <a href="/" class="brand" aria-label="HayaIPTV - accueil"><img class="mark" src="/logo.svg" alt="" width="38" height="38"><span class="word">haya<b>iptv</b></span></a>
    <div class="nav-cta"><button type="button" class="theme-btn" id="theme-btn" aria-label="Changer de th&egrave;me">&#9728;&#65039;</button>
      <a class="btn small ghost" href="/blog/">Blog</a><a class="btn small" href="/#tarifs">Voir les offres</a></div>
  </nav>
</header>
<main class="page"><div class="wrap">
'@

$foot = @'
</div></main>
<footer>
  <div class="wrap">
    <div class="legal" style="border-top:0;padding-top:0">
      <span>&copy; 2026 HayaIPTV &mdash; Tous droits r&eacute;serv&eacute;s.</span>
      <span><a href="/" style="color:inherit">Accueil</a> &middot; <a href="/channels" style="color:inherit">Cha&icirc;nes</a> &middot; <a href="/blog/" style="color:inherit">Blog</a> &middot; <a href="/contact" style="color:inherit">Contact</a> &middot; <a href="/mentions-legales" style="color:inherit">Mentions l&eacute;gales</a></span>
    </div>
  </div>
</footer>
<script src="/data.js?v={{V}}"></script>
<script>const d = hayaLoad(); hayaApplyTheme(d.theme); hayaThemeButton(document.getElementById("theme-btn"));</script>
</body>
</html>
'@

function Page($title, $desc, $url, $ogtype, $ld, $body) {
  $h = $head.Replace('{{TITLE}}', (Esc $title)).Replace('{{DESC}}', (Esc $desc)).Replace('{{URL}}', $url).Replace('{{OGTYPE}}', $ogtype).Replace('{{LD}}', $ld).Replace('{{V}}', $V)
  return $h + $body + $foot.Replace('{{V}}', $V)
}
function Json($s) { return ($s | ConvertTo-Json -Compress -Depth 10) }

# Lecture des articles
$posts = @()
foreach ($f in Get-ChildItem $src -Filter *.html | Sort-Object Name) {
  $lines = [IO.File]::ReadAllLines($f.FullName, [Text.Encoding]::UTF8)
  $posts += [pscustomobject]@{ Title = $lines[0].Trim(); Desc = $lines[1].Trim(); Slug = $lines[2].Trim(); Date = $lines[3].Trim(); Emoji = $lines[4].Trim(); Body = ($lines[5..($lines.Count - 1)] -join "`n") }
}

$months = @('janvier','f&eacute;vrier','mars','avril','mai','juin','juillet','ao&ucirc;t','septembre','octobre','novembre','d&eacute;cembre')
function FrDate($iso) { $d = [datetime]::ParseExact($iso, 'yyyy-MM-dd', $null); return "$($d.Day) $($months[$d.Month - 1]) $($d.Year)" }

foreach ($p in $posts) {
  $url = "https://hayaiptv.com/blog/$($p.Slug)"
  $ld = Json @{
    '@context' = 'https://schema.org'
    '@graph' = @(
      @{ '@type' = 'Article'; headline = $p.Title; description = $p.Desc; datePublished = $p.Date; dateModified = $p.Date; inLanguage = 'fr-FR'; mainEntityOfPage = $url; image = 'https://hayaiptv.com/og-image.png'
         author = @{ '@type' = 'Organization'; name = 'HayaIPTV'; url = 'https://hayaiptv.com/' }; publisher = @{ '@type' = 'Organization'; name = 'HayaIPTV'; logo = @{ '@type' = 'ImageObject'; url = 'https://hayaiptv.com/apple-touch-icon.png' } } },
      @{ '@type' = 'BreadcrumbList'; itemListElement = @(
         @{ '@type' = 'ListItem'; position = 1; name = 'HayaIPTV'; item = 'https://hayaiptv.com/' },
         @{ '@type' = 'ListItem'; position = 2; name = 'Blog'; item = 'https://hayaiptv.com/blog/' },
         @{ '@type' = 'ListItem'; position = 3; name = $p.Title; item = $url }) }
    )
  }
  $others = $posts | Where-Object { $_.Slug -ne $p.Slug }
  $related = ($others | ForEach-Object { "<a class=`"card`" href=`"/blog/$($_.Slug)`"><span class=`"em`" aria-hidden=`"true`">$($_.Emoji)</span><b>$($_.Title)</b></a>" }) -join "`n"
  $body = @"
<article class="article">
  <nav aria-label="Fil d'Ariane" class="meta"><a href="/" style="color:inherit">Accueil</a> &rsaquo; <a href="/blog/" style="color:inherit">Blog</a></nav>
  <h1>$($p.Title)</h1>
  <p class="meta">Par l'&eacute;quipe HayaIPTV &middot; <time datetime="$($p.Date)">$(FrDate $p.Date)</time></p>
$($p.Body)
  <div class="cta-end"><h2>Pr&ecirc;t &agrave; essayer la t&eacute;l&eacute; par Internet ?</h2><p class="muted">Direct, replay, guide TV et 4K HDR sur tous vos &eacute;crans.</p><a class="btn" href="/#tarifs">D&eacute;couvrir les formules HayaIPTV &rarr;</a></div>
  <h2>&Agrave; lire aussi</h2>
  <div class="cards">$related</div>
</article>
"@
  [IO.File]::WriteAllText((Join-Path $out "$($p.Slug).html"), (Page $p.Title $p.Desc $url 'article' $ld $body), $utf8)
}

# Page /blog
$cards = ($posts | Sort-Object Date -Descending | ForEach-Object { "<a class=`"card`" href=`"/blog/$($_.Slug)`"><span class=`"em`" aria-hidden=`"true`">$($_.Emoji)</span><b>$($_.Title)</b><span>$($_.Desc)</span></a>" }) -join "`n"
$ldBlog = Json @{ '@context' = 'https://schema.org'; '@type' = 'Blog'; name = 'Blog HayaIPTV'; url = 'https://hayaiptv.com/blog/'; inLanguage = 'fr-FR'
  blogPost = @($posts | ForEach-Object { @{ '@type' = 'BlogPosting'; headline = $_.Title; url = "https://hayaiptv.com/blog/$($_.Slug)"; datePublished = $_.Date } }) }
$blogBody = @"
<div class="article" style="max-width:1000px">
  <nav aria-label="Fil d'Ariane" class="meta"><a href="/" style="color:inherit">Accueil</a> &rsaquo; Blog</nav>
  <span class="eyebrow" style="margin-top:16px;display:inline-block">Guides &amp; conseils</span>
  <h1>Le blog <span class="grad">HayaIPTV</span></h1>
  <p class="lead">Tout comprendre &agrave; la t&eacute;l&eacute;vision par Internet : fonctionnement de l'IPTV, d&eacute;bit conseill&eacute;, installation sur Smart TV et comparatifs.</p>
  <div class="cards">$cards</div>
</div>
"@
[IO.File]::WriteAllText((Join-Path $out 'index.html'), (Page 'Blog IPTV : guides et conseils pour la t&eacute;l&eacute; par Internet' 'Guides HayaIPTV : comprendre l''IPTV, d&eacute;bit Internet pour la 4K, installer une application IPTV sur Smart TV, IPTV ou satellite.' 'https://hayaiptv.com/blog/' 'website' $ldBlog $blogBody).Replace('&amp;eacute;','&eacute;'), $utf8)

# Liste des URL pour le sitemap
$posts | ForEach-Object { "https://hayaiptv.com/blog/$($_.Slug)" }
