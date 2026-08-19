export function ProductTitle({ name }: { name: string }) {
  const [brand, ...description] = name.trim().split(/\s+/);

  return (
    <>
      <strong className="product-brand">{brand}</strong>
      {description.length > 0 ? ` ${description.join(" ")}` : ""}
    </>
  );
}
