declare module 'ngeohash' {
  function encode(lat: number, lon: number, precision?: number): string;
  function decode(hash: string): { latitude: number; longitude: number };
  function neighbors(hash: string): string[];
  function bbox(hash: string): { minlat: number; minlon: number; maxlat: number; maxlon: number };
  export { encode, decode, neighbors, bbox };
  export default { encode, decode, neighbors, bbox };
}
