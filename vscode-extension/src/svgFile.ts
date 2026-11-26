export interface FileUriLike {
  readonly scheme: string;
  readonly path: string;
}

/** Explorer badge candidate: a local `.svg` path. Directories are filtered later. */
export function isSvgFileUri(uri: FileUriLike): boolean {
  return uri.scheme === "file" && /\.svg$/iu.test(uri.path);
}
