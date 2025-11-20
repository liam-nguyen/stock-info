declare module "@sparticuz/chromium-min" {
  export function executablePath(input?: string): Promise<string> | string;
  export const args: string[];
  export const headless: boolean;
  export const defaultViewport: {
    width: number;
    height: number;
  };
}
