declare module "@sparticuz/chromium-min" {
  export function executablePath(): string | Promise<string>;
  export const args: string[];
  export const headless: boolean;
  export const defaultViewport: {
    width: number;
    height: number;
  };
}
