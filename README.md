# API de Presenças

API que recebe o cadastro de funcionários e as marcações de presença vindas do
tablet. Usa Node.js + Express + SQLite (fica tudo num único ficheiro `data/attendance.db`,
sem precisar instalar um banco de dados à parte).

## Como correr localmente

```bash
npm install
npm start
```

O servidor sobe em `http://localhost:3000`. Teste com:

```bash
curl http://localhost:3000/health
```

## Registar um tablet

Cada tablet precisa de uma identidade própria, para que só dispositivos autorizados
consigam marcar presenças:

```bash
node scripts/seed-device.js "tablet-entrada-principal" "Entrada principal"
```

Isto imprime uma `api_key` — guarde-a, é ela que o tablet vai enviar em todos os
pedidos de marcação de presença, nos cabeçalhos:

```
x-device-id: tablet-entrada-principal
x-device-key: <a chave gerada>
```

## Endpoints

### Funcionários

| Método | Rota                 | Descrição                                |
|--------|-----------------------|-------------------------------------------|
| GET    | `/api/employees`      | Lista funcionários ativos                  |
| POST   | `/api/employees`      | Cadastra um novo funcionário               |
| PUT    | `/api/employees/:id`  | Edita nome, departamento, email ou foto    |
| DELETE | `/api/employees/:id`  | Desativa o funcionário (não apaga histórico)|

Exemplo de cadastro:

```bash
curl -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ana Cardoso",
    "department": "Financeiro",
    "email": "ana@empresa.com",
    "photo_base64": "data:image/jpeg;base64,..."
  }'
```

### Presenças (exige autenticação do tablet)

| Método | Rota            | Descrição                                       |
|--------|------------------|--------------------------------------------------|
| POST   | `/api/checkins`  | Regista uma presença                              |
| GET    | `/api/checkins`  | Lista presenças (filtros `?date=` e `?employee_id=`) |

Exemplo de marcação, chamado pelo tablet depois de reconhecer a pessoa:

```bash
curl -X POST http://localhost:3000/api/checkins \
  -H "Content-Type: application/json" \
  -H "x-device-id: tablet-entrada-principal" \
  -H "x-device-key: <chave do tablet>" \
  -d '{
    "employee_id": 1,
    "method": "face",
    "confidence": 0.94,
    "evidence_photo_base64": "data:image/jpeg;base64,..."
  }'
```

A API impede marcações repetidas do mesmo funcionário em menos de 60 segundos
(devolve `"duplicate": true` em vez de criar um novo registo).

## Onde entra o reconhecimento facial

Esta API **não faz** o reconhecimento facial — ela só regista o resultado.
A divisão de responsabilidades é:

1. **Tablet / motor de reconhecimento** — captura a foto, compara com os
   funcionários cadastrados (localmente com ML Kit, ou chamando um serviço de
   nuvem como AWS Rekognition / Azure Face API) e decide *quem* é a pessoa.
2. **Esta API** — recebe o `employee_id` já identificado, grava o registo de
   presença com hora, dispositivo e (opcionalmente) uma foto de evidência.

Isto mantém a API simples e permite trocar o motor de reconhecimento no futuro
sem mexer no backend. O campo `face_template` na tabela `employees` já está
reservado para guardar o "descritor facial" quando ligarmos o motor de
verdade.

## Ligar ao protótipo visual (presenca_v3.html)

O ficheiro `presenca_v3.html` já está ligado a esta API. Para testar os dois
juntos:

1. Suba a API: `npm install` e depois `npm start` (fica em `http://localhost:3000`).
2. Registe um tablet: `node scripts/seed-device.js "tablet-entrada-principal" "Entrada principal"`
   e copie a `api_key` que aparece no terminal.
3. Abra `presenca_v3.html` num editor de texto e, no topo do bloco `<script>`,
   cole a chave em `CONFIG.DEVICE_KEY`.
4. Abra o `presenca_v3.html` no navegador (basta clicar duas vezes no
   ficheiro). No canto superior direito deve aparecer "API ligada".
5. Vá a "Cadastrar funcionário", capture uma foto e grave — o funcionário
   passa a existir de verdade na base de dados.
6. Vá a "Presença" e clique em "Simular leitura facial" — agora regista uma
   presença real na tabela `checkins`, escolhendo aleatoriamente entre os
   funcionários cadastrados (o sorteio substitui o motor de reconhecimento
   facial, que ainda não está ligado).

Se a API estiver desligada, o indicador no ecrã fica vermelho e as ações
mostram um aviso em vez de falhar silenciosamente.

## Próximo passo sugerido

Substituir o sorteio aleatório do botão "Simular leitura facial" pelo motor
de reconhecimento facial de verdade (deteção ao vivo no ecrã + comparação
com as fotos cadastradas), mantendo a chamada a `POST /api/checkins` como
está.
