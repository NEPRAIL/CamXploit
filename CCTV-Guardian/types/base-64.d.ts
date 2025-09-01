declare module "base-64" {
  const value: { encode: (s: string) => string; decode: (s: string) => string };
  export default value;
}
