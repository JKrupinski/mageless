import type { ResultOf } from 'gql.tada';
import type { ProductPageQuery } from '../graphql/queries/catalog';
import type { ConfigurableOptionProp, VariantProp } from '@/components/product/AddToCartForm';
import type { GalleryImage } from '@/components/product/ProductGallery';
import { productUrl, toPlainText } from '../format';
import { breadcrumbJsonLd, productJsonLd } from '../seo/jsonld';

type ProductItem = NonNullable<
  NonNullable<NonNullable<ResultOf<typeof ProductPageQuery>['products']>['items']>[number]
>;

type ProductCategory = NonNullable<NonNullable<ProductItem['categories']>[number]>;

export interface ProductViewModel {
  name: string;
  sku: string;
  href: string;
  inStock: boolean;
  onlyXLeft: number | null;
  ratingPercent: number | null;
  reviewCount: number | null;
  descriptionHtml: string | null;
  shortDescriptionHtml: string | null;
  gallery: GalleryImage[];
  options: ConfigurableOptionProp[];
  variants: VariantProp[];
  price: {
    final: { value: number | null; currency: string | null };
    regular: { value: number | null; currency: string | null };
    percentOff: number | null;
    maximum: { value: number | null; currency: string | null } | null;
  };
  breadcrumbs: { name: string; href: string }[];
  seo: { title: string; description: string; image: string | null };
  jsonLd: Record<string, unknown>[];
}

/**
 * Turns one Magento product into everything the page needs.
 *
 * Keeping this a pure function means the product page's logic — variant
 * matching, breadcrumb selection, structured data — is unit-testable without a
 * running Magento or a browser.
 */
export function toProductViewModel(product: ProductItem, siteUrl: string): ProductViewModel {
  const minimum = product.price_range.minimum_price;
  const href = productUrl(product);
  const absoluteUrl = new URL(href, siteUrl).toString();

  const gallery: GalleryImage[] = (product.media_gallery ?? [])
    .flatMap((entry) =>
      entry && !entry.disabled && entry.url
        ? [{ url: entry.url, label: entry.label ?? null, position: entry.position ?? 0 }]
        : [],
    )
    .sort((a, b) => a.position - b.position)
    .map(({ url, label }) => ({ url, label }));

  if (gallery.length === 0 && product.image?.url) {
    gallery.push({ url: product.image.url, label: product.image.label ?? null });
  }

  const options: ConfigurableOptionProp[] =
    'configurable_options' in product && product.configurable_options
      ? product.configurable_options.flatMap((option) =>
          // An option without an attribute code or label cannot be selected
          // against a variant, so it is dropped rather than rendered broken.
          option?.attribute_code
            ? [
                {
                  uid: option.uid,
                  attributeCode: option.attribute_code,
                  label: option.label ?? option.attribute_code,
                  values: (option.values ?? []).flatMap((value) =>
                    value?.uid
                      ? [
                          {
                            uid: value.uid,
                            label: value.label ?? '',
                            swatch: value.swatch_data?.value ?? null,
                          },
                        ]
                      : [],
                  ),
                },
              ]
            : [],
        )
      : [];

  const variants: VariantProp[] =
    'variants' in product && product.variants
      ? product.variants.flatMap((variant) => {
          if (!variant?.product) return [];
          const variantPrice = variant.product.price_range.minimum_price;
          return [
            {
              optionUids: (variant.attributes ?? []).flatMap((attribute) =>
                attribute?.uid ? [attribute.uid] : [],
              ),
              sku: variant.product.sku ?? '',
              inStock: variant.product.stock_status === 'IN_STOCK',
              final: variantPrice.final_price,
              regular: variantPrice.regular_price,
              percentOff: variantPrice.discount?.percent_off ?? null,
            },
          ];
        })
      : [];

  // Magento assigns a product to many categories; the deepest breadcrumb trail
  // is the most specific and matches what the shopper clicked through.
  const category = (product.categories ?? []).reduce<ProductCategory | null>(
    (deepest, candidate) => {
      if (!candidate) return deepest;
      const depth = candidate.breadcrumbs?.length ?? 0;
      const currentDepth = deepest?.breadcrumbs?.length ?? -1;
      return depth > currentDepth ? candidate : deepest;
    },
    null,
  );

  const breadcrumbs = [
    ...(category?.breadcrumbs ?? []).flatMap((crumb) =>
      crumb
        ? [
            {
              name: crumb.category_name ?? '',
              href: `/${crumb.category_url_path ?? ''}${product.url_suffix ?? ''}`,
            },
          ]
        : [],
    ),
    ...(category
      ? [
          {
            name: category.name ?? '',
            href: `/${category.url_path ?? ''}${category.url_suffix ?? ''}`,
          },
        ]
      : []),
    { name: product.name ?? '', href },
  ];

  const description = toPlainText(
    product.meta_description ?? product.short_description?.html ?? product.description?.html,
  );

  return {
    name: product.name ?? product.sku ?? '',
    sku: product.sku ?? '',
    href,
    inStock: product.stock_status === 'IN_STOCK',
    onlyXLeft: product.only_x_left_in_stock ?? null,
    ratingPercent: product.rating_summary ?? null,
    reviewCount: product.review_count ?? null,
    descriptionHtml: product.description?.html ?? null,
    shortDescriptionHtml: product.short_description?.html ?? null,
    gallery,
    options,
    variants,
    price: {
      final: minimum.final_price,
      regular: minimum.regular_price,
      percentOff: minimum.discount?.percent_off ?? null,
      maximum: product.price_range.maximum_price?.final_price ?? null,
    },
    breadcrumbs,
    seo: {
      title: product.meta_title ?? product.name ?? '',
      description,
      image: gallery[0]?.url ?? null,
    },
    jsonLd: [
      productJsonLd({
        name: product.name ?? '',
        sku: product.sku ?? '',
        url: absoluteUrl,
        image: gallery[0]?.url ?? null,
        description,
        price: minimum.final_price.value ?? null,
        currency: minimum.final_price.currency ?? null,
        inStock: product.stock_status === 'IN_STOCK',
        ratingValue: product.rating_summary ?? null,
        reviewCount: product.review_count ?? null,
      }),
      breadcrumbJsonLd(
        breadcrumbs.map((crumb) => ({
          name: crumb.name,
          url: new URL(crumb.href, siteUrl).toString(),
        })),
      ),
    ],
  };
}
