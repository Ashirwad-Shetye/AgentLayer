declare module "inquirer" {
  interface InquirerModule {
    prompt<T extends Record<string, unknown>>(
      questions: unknown[],
    ): Promise<T>;
  }

  const inquirer: InquirerModule;
  export default inquirer;
}
