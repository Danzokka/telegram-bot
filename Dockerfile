# Use a imagem oficial do Node.js como base
FROM node:latest

# Defina o diretório de trabalho dentro do container
WORKDIR /app

# Copie os arquivos de configuração do projeto
COPY package*.json ./

# Instale as dependências do projeto
RUN npm install

# Copie o restante do código para o container
COPY . .

# Compile o código TypeScript para JavaScript
RUN npm run build

# Exponha a porta padrão do NestJS
EXPOSE 5000

# Comando para iniciar a aplicação
CMD ["npm", "run", "start:prod"]