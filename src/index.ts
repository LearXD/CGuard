import fs from "fs"
import path from 'path'

import child_process from 'child_process'

(async () => {
    console.log(fs.readFileSync(path.resolve(__dirname, '..', 'assets', 'header.txt'), "utf8"))
    console.log("🚀 Iniciando...");

    console.log("💿 Lendo configurações...");

    const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'config.json'), "utf8"))

    const inputDir = path.resolve(__dirname, '..', ...config.inputDir.split('/'));
    const outputDir = path.resolve(__dirname, '..', ...config.outputDir.split('/'));
    const executions = config.executions;

    const files = fs.readdirSync(inputDir);

    if (files.length < 1) {
        console.log("📂 Nenhum arquivo encontrado.")
        return;
    }

    console.log(`📂 Lendo ${files.length} arquivos...`);
    for (let file of files) {
        if (path.extname(file) === ".c") {
            console.log(`📄 Compilando ${file}...`);
            const compile = child_process.spawn('gcc', [path.resolve(inputDir, file), '-o', path.resolve(outputDir, path.basename(file, ".c"))]);

            compile.on('exit', (code, signal) => {
                if (code === 0) {
                    console.log(`📄 Compilado ${file}!`);
                    console.log(`📄 Executando ${file}...`);

                    let running = false;
                    let question = -1;

                    const run = child_process.spawn(path.resolve(outputDir, path.basename(file, ".c")));

                    executions.forEach((execution, index) => {
                        question = index;
                        console.log(`ℹ Executando input ${execution.input}...`);
                        run.stdin.write(execution.input);
                        run.stdin.end();
                    });

                    run.stdout.on('data', data => {
                        console.log(`Output: ${data}`);

                        if (question === -1) {
                            return;
                        }
                        
                        if (checkResponse(data.toString(), executions[question].output)) {
                            console.log(`✔️ Resposta correta para a questão ${question}!`);
                        } else {
                            console.log(`❌ Resposta incorreta para a questão ${question}!`);
                        }

                    });


                    run.on('exit', (code) => {
                        running = false
                        console.log(`ℹ ${file} parou de executar com o código ${code}!`);
                    });



                } else {
                    console.log(`📄 Erro ao compilar ${file}!`);
                }
            });
        }
    }
})()

const checkResponse = (response: string, expected: string) => {
    return response.includes(expected);
}