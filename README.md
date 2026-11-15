# Conviction — Shopify theme

A custom Online Store 2.0 theme for conviction.faith. Everything below is done in the Shopify admin; no code editing needed.

## 1. Install

Online Store → Themes → Add theme → Upload zip file → choose `conviction-theme.zip`. Click **Customize** to preview before publishing.

## 2. Pages and menus

Create two pages in Online Store → Pages and pick their template (right-hand panel):

| Page title | Template | Handle |
|---|---|---|
| About | `page.about` | `about` |
| Help | `page.help` | `help` |

The About and Help text from the current site is already filled in on those templates; edit it in the theme editor. The page's own content box can stay empty.

Menus (Online Store → Navigation):

- **Main menu**: Shop → `/collections/all`, About → `/pages/about`, Help → `/pages/help`
- **Footer** (Shop column): the three products + Shop all
- Create **Help** (contact, shipping, returns, sizing → `/pages/help#contact` etc.) and **Info** (our story → `/pages/about`), then in the theme editor point the Help and Info footer columns at them. "prayer wall (soon)" is already set as the Info column's extra line.

## 3. Product setup

**Short names.** Your old cards say "John 16:8 Tee" while the full title is "Conviction x Eleyxos – John 16:8 Tee". Add a product metafield definition (Settings → Custom data → Products):

| Name | Namespace and key | Type |
|---|---|---|
| Short title | `custom.short_title` | Single line text |
| Details | `custom.details` | Multi-line text |
| Size chart | `custom.size_chart` | Page (reference) |

**Details** is one `Label: value` per line, for example:

```
Fabric: 100% cotton
Weight: 9.7 oz/yd² (330 g/m²)
Thickness: Moderate
Fit: Loose, unisex
Print size: 40 × 52 cm
Care: Machine wash at 30°C, gentle cycle. Do not bleach. Tumble dry low. Iron at low temperature, avoid ironing on the print. Do not dry clean.
Batch note: Small differences between production batches are normal. Each run is checked to keep them as close as possible.
```

**"new" badge.** Add the tag `new` to a product.

**Images.** Upload the flat front shot first and the back shot second: cards swap to image 2 on hover. Lifestyle shots go after those. Each product needs a Size option (and optionally Color) for the size buttons to work.

**Size charts.** Create a page per chart (e.g. "Size chart – Tee"), paste the table below into the editor's `<>` HTML view, and select that page in the product's Size chart metafield. Set a fallback chart in the theme editor on the Product template → Size chart block.

```html
<p>Garment measurements, inches / cm. Unisex sizing.</p>
<table>
<thead><tr><th></th><th>S</th><th>M</th><th>L</th><th>XL</th><th>2XL</th><th>3XL</th></tr></thead>
<tbody>
<tr><td>Chest</td><td>20.5 / 52</td><td>21.3 / 54</td><td>22.0 / 56</td><td>22.8 / 58</td><td>23.6 / 60</td><td>24.4 / 62</td></tr>
<tr><td>Length</td><td>27.6 / 70</td><td>28.3 / 72</td><td>29.1 / 74</td><td>29.9 / 76</td><td>30.3 / 77</td><td>30.7 / 78</td></tr>
<tr><td>Shoulder</td><td>18.5 / 47</td><td>19.3 / 49</td><td>20.1 / 51</td><td>20.9 / 53</td><td>21.7 / 55</td><td>22.4 / 57</td></tr>
<tr><td>Sleeve</td><td>7.9 / 20</td><td>8.1 / 20.5</td><td>8.3 / 21</td><td>8.5 / 21.5</td><td>8.7 / 22</td><td>8.9 / 22.5</td></tr>
</tbody>
</table>
```

(These are read off the current John 16:8 page, whose table had the inch and cm numbers run together. Double-check against your supplier sheet.)

## 4. Theme editor (Customize)

Your photos are built into this theme as defaults, so the home page, About page and footer show them right after upload. To swap one, pick a new image in that section; it takes over from the built-in photo. Product photos are the exception: they come from each product's Media in Shopify (see the product table below).


| Where | Photo |
|---|---|
| Header → Logo | Leave empty: the theme shows the cut-out CONVICTION letters (logo width 150 px) |
| Home → Hero image | `4J1A2949` (sunset over the hills, John 16:8 back) |
| Home → Image with text | `4J1A9168` (two friends, floral back and front) |
| Home → Wear it, photo 1 | `4J1A8932` (jersey pair) → product: Romans 8:6 Jersey |
| Home → Wear it, photo 2 | `4J1A9268` (floral back on the street) → product: Romans 8:5–6 Tee |
| Home → Wear it, photo 3 | `4J1A9420` (John 16:8 pair) → product: John 16:8 Tee |
| About → Page opener | `4J1A2600` |
| About → What conviction means | `4J1A2409` (close-up of the falling figure print) |
| About → How to support us | `4J1A9268` |
| Footer → Photo inside the letters | `4J1A2949` (sunset). The big CONVICTION across the footer shows this photo through its letters. |

Product images (Products → each product → Media), in this order. The first two are what shows on product cards, with the second appearing on hover:

| Product | Order |
|---|---|
| John 16:8 Tee | `4J1A3720` (éleyxos front, hat), `4J1A2409` (back), `4J1A9420`, `4J1A9422` (éleyxos close-up), `4J1A2949` |
| Romans 8:5–6 Tee | `4J1A47241` (front, levee), `4J1A9268` (back), `4J1A9168`, `4J1A9217` (logo close-up), `4J1A2600` |
| Romans 8:6 Jersey | `4J1A8932` (pair), `4J1A9541` (chest close-up). Add a flat back shot when you have one, so the hover shows Romans 8:6. |

Upload the original photos; Shopify resizes them for every screen.

Theme settings (gear icon): colors, headline style (condensed bold to match the logo, which is the default; blackletter; or plain bold), bag behavior, free shipping threshold, social links, favicon.

## 5. Shipping

The bag shows progress toward free shipping at $50, but the rate itself lives in Settings → Shipping and delivery: add a free rate with an order-price condition of $50 and up. Restrict the shipping zone to the United States to match "US addresses only for now."

## 6. Go live

Publish the theme, then Settings → Domains → connect `conviction.faith`. Your current site is a separate Next.js deployment, so point the domain's DNS at Shopify (A record `23.227.38.65`, CNAME `www` → `shops.myshopify.com`) only when you're ready to switch. Shopify's domain screen walks through it.

Old product URLs were `/shop/<handle>`; Shopify's are `/products/<handle>`. Add redirects in Online Store → Navigation → URL Redirects:

- `/shop` → `/collections/all`
- `/shop/john-16-8-tee` → `/products/<your handle>`
- `/shop/romans-8-5-6-floral-tee` → `/products/<your handle>`
- `/shop/romans-8-6-jersey` → `/products/<your handle>`
- `/about` → `/pages/about`
- `/help` → `/pages/help`
