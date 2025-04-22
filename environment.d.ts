declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOKEN: string;
      DATABASE: string;
    }
  }
}

export {}