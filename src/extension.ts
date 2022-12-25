import * as vscode from "vscode";
import { Configuration, OpenAIApi } from "openai";

export const activate = async (context: vscode.ExtensionContext) => {
  console.log('Congratulations, your extension "openpilot" is now active!');

  const openAIInit = async () => {
    const config = new Configuration({
      apiKey: await context["secrets"].get("x-auth-token"),
    });
    const openai = new OpenAIApi(config);
    return openai;
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("openpilot.helloWorld", () => {
      vscode.window.showInformationMessage("Hello World from OpenPilot!");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("openpilot.registerToken", async () => {
      const token = await vscode.window.showInputBox({
        placeHolder: "c1sd634fv53as1v31c31x",
        title: "Open AI Token",
        prompt: "Enter your Open AI token please",
      });
      if (token) {
        await context["secrets"].store("x-auth-token", token);
        await vscode.window.showInformationMessage("Token stored successfully");
      } else {
        await vscode.window.showErrorMessage("Token stored unsuccessfully");
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("openpilot.createComments", async () => {
      const token = await context.secrets.get("x-auth-token");
      console.log(token);
      if (!token) {
        return await vscode.window.showErrorMessage(
          "Please set Open AI token first"
        );
      }

      const openAI = await openAIInit();
      const editor = vscode.window.activeTextEditor;
      const selectedText = editor?.document.getText(editor.selection);

      if (!selectedText) {
        return await vscode.window.showErrorMessage(
          "Please first select the text"
        );
      }

      try {
        const response = await openAI.createCompletion({
          model: "text-davinci-002",
          prompt: `Explain the code in a meaning full manner ${selectedText}`,
          temperature: 0,
          max_tokens: 256,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        });

        if (response.data.choices.length < 1) {
          return await vscode.window.showErrorMessage(
            "Unable to generate comments"
          );
        }

        vscode.window.showInformationMessage("Generating comments");
        const text = response.data.choices[0].text
          ?.trimStart()
          .trimEnd()
          .replace(/.{50}\S*\s+/g, "$&\n\t");

        const updatedText = `/*\n\t${text}\n*/\n\n`;
        await editor?.insertSnippet(new vscode.SnippetString(updatedText));
        await editor?.insertSnippet(new vscode.SnippetString(selectedText));
      } catch (error) {
        console.log(error);
      }
    })
  );
};

export const deactivate = () => {};
