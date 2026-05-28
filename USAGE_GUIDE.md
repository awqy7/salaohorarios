# 🎯 Guia de Uso - Sistema GoldCuts

## 📋 Índice
- [Instalação](#instalação)
- [Execução](#execução)
- [Fluxo de Uso](#fluxo-de-uso)
- [Recursos](#recursos)
- [Solução de Problemas](#solução-de-problemas)

---

## 🔧 Instalação

### Pré-requisitos
- Node.js 16+
- npm ou yarn

### Passos

```bash
# 1. Navegue até o diretório do projeto
cd salao

# 2. Instale as dependências
npm install

# 3. Crie um arquivo .env (opcional, para Supabase)
cp .env.example .env
```

---

## 🚀 Execução

### Modo Desenvolvimento
```bash
npm run dev
```
O aplicativo estará disponível em `http://localhost:5173` ou `5174` se a porta estiver em uso.

### Build para Produção
```bash
npm run build
```

### Preview da Build
```bash
npm run preview
```

### Lint do Código
```bash
npm run lint
```

---

## 👥 Fluxo de Uso

### 🎯 Para Clientes

1. **Acesso**
   - Entre em `http://localhost:5173` (ou URL da aplicação)
   - Você já está na página inicial

2. **Agendamento (Passo 1: Escolha do Serviço)**
   ```
   ✓ Clique em um dos serviços disponíveis
   ✓ Card será destacado em ouro quando selecionado
   ✓ Serviço mais popular possui badge ⭐
   ```

3. **Seleção de Data e Hora (Passo 2)**
   ```
   ✓ Selecione uma data (7 dias futuros)
   ✓ "HOJE" é indicado com badge de ouro
   ✓ Selecione um horário disponível
   ✓ Horários ocupados não aparecem
   ```

4. **Dados Pessoais (Passo 3)**
   ```
   ✓ Insira seu nome completo
   ✓ Insira seu WhatsApp (máscara automática: (00) 00000-0000)
   ✓ Clique em "Continuar"
   ```

5. **Pagamento**
   ```
   ✓ Verifique o resumo do pedido
   ✓ Copie a chave PIX automaticamente
   ✓ Faça a transferência PIX
   ✓ Tire print ou faça upload do comprovante
   ✓ Clique em "Confirmar Pagamento"
   ⏳ Aguarde 800ms para confirmação
   ```

6. **Confirmação**
   ```
   ✓ Você verá a página de sucesso
   ✓ Seu agendamento está registrado
   ✓ Aguarde confirmação do barbeiro (status: PENDENTE)
   ```

---

### 💼 Para Barbeiros

1. **Acesso**
   - Clique em "Área do Barbeiro" no rodapé
   - ou acesse `http://localhost:5173/barber/login`

2. **Login**
   ```
   Email: admin@gmail.com (padrão)
   Senha: (conforme configurado no Supabase)
   
   ⚠️ Sem Supabase: qualquer email/senha funciona localmente
   ```

3. **Dashboard - Abas Disponíveis**

   **📊 Dashboard (Aba Padrão)**
   ```
   ✓ Faturamento total
   ✓ Quantidade de clientes
   ✓ Agendamentos de hoje
   ✓ Gráfico de faturamento por serviço
   ```

   **📅 Agendamentos**
   ```
   ✓ Lista de TODOS os agendamentos
   ✓ Agendamentos pendentes aparecem PRIMEIRO
   ✓ Badge indicando:
      • "Pendente" - Precisa confirmar (botão CONFIRMADOR em ouro)
      • "Confirmado" - Já confirmado (botão CANCELAR disponível)
      • "Pago" - Pagamento recebido
      • "Serviço" - Nome do serviço
      • "R$ XX,XX" - Valor cobrado
   ✓ Botão "Comprovante" para visualizar comprovante de pagamento
   ```

   **⏰ Horários**
   ```
   ✓ Selecione dias que trabalha (checkbox)
   ✓ Configure horário inicial e final
   ✓ Almoço fixo 12:00 - 13:00 (automático)
   ✓ Clique em "Salvar Horários"
   ✓ Dados salvos localmente ou no Supabase
   ```

4. **Confirmar Agendamento**
   ```
   ✓ Veja agendamento com status "PENDENTE"
   ✓ Clique no botão dourado "Confirmar"
   ⏳ Aguarde atualização (loading spinner)
   ✓ Status muda para "CONFIRMADO"
   ✓ Cliente verá seu agendamento confirmado
   ```

5. **Cancelar Agendamento**
   ```
   ✓ Clique no botão vermelho "Cancelar"
   ⏳ Aguarde atualização
   ✓ Agendamento é removido da lista
   ✓ Status muda para "CANCELADO"
   ```

6. **Logout**
   ```
   ✓ Clique em "Sair" no topo direito
   ✓ Você retorna à página inicial
   ```

---

## ✨ Recursos

### 🎨 Componentes Reutilizáveis

#### SelectableCard
Componente para seleção com feedback visual
```jsx
<SelectableCard
  isSelected={isSelected}
  onClick={handleClick}
  style={{ /* custom styles */ }}
>
  Conteúdo
</SelectableCard>
```

#### ActionButton
Botão com loading states
```jsx
<ActionButton
  icon={IconComponent}
  label="Ação"
  isLoading={isLoading}
  isDisabled={isDisabled}
  variant="primary" // "primary" | "danger" | "ghost"
  size="sm" // "sm" | "md" | "lg"
  onClick={handleClick}
/>
```

### 🛡️ Validações

- **Telefone**: Máscara automática com validação de formato
- **Agendamento**: Não permite horários conflitantes
- **Horários**: Valida horário de início < fim
- **Almoço**: Automaticamente configurado 12:00 - 13:00

### 🔄 Sincronização

- **LocalStorage**: Fallback quando Supabase não está disponível
- **Supabase**: Armazenamento em banco de dados quando configurado
- **Auto-refresh**: Dashboard atualiza a cada 15 segundos

### 🎯 Estados Visuais

```
Selecionado:
- Border: 2px solid gold
- Scale: 1.02
- Transição: 0.2s ease

Loading:
- Spinner animado
- Opacidade: 0.5
- Disabled: true

Hover:
- Cursor: pointer (ou not-allowed se disabled)
- Cor muda para ouro
```

---

## 🐛 Solução de Problemas

### Problema: Porta 5173 em uso
**Solução**: Vite tentará automaticamente a próxima porta (5174, 5175, etc)

### Problema: Agendamentos não aparecem
**Solução**: 
- Verifique localStorage do navegador (F12 > Application > Local Storage)
- Limpe o cache do navegador
- Faça novo agendamento

### Problema: Login do barbeiro não funciona
**Solução**:
- Se Supabase não está configurado, qualquer email/senha funciona localmente
- Configure .env com credenciais do Supabase
- Crie usuário no Supabase Auth

### Problema: Horários não salvam
**Solução**:
- Verifique console (F12 > Console) por erros
- Salve novamente
- Se Supabase está fora, dados são salvos em localStorage

### Problema: Comprovante de pagamento não abre
**Solução**:
- Garanta que o arquivo foi upload corretamente
- Verifique se browser permite pop-ups
- Tente F12 > Network para verificar requisição

---

## 📊 Estrutura de Dados

### Appointment (Agendamento)
```typescript
{
  id: string;                    // UUID único
  clientName: string;            // Nome do cliente
  clientPhone: string;           // WhatsApp do cliente
  serviceId: string;             // ID do serviço
  date: string;                  // YYYY-MM-DD
  time: string;                  // HH:MM
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paid: boolean;                 // Pagamento recebido?
  paymentProof?: string;         // Base64 da imagem/PDF
  createdAt: string;             // ISO timestamp
}
```

### BarberSchedule (Horário Trabalho)
```typescript
{
  id: string;                    // Dia da semana (0-6)
  dayOfWeek: number;             // Domingo=0, Segunda=1, etc
  isWorking: boolean;            // Trabalha este dia?
  startTime: string;             // HH:MM início
  endTime: string;               // HH:MM fim
  lunchStart: string;            // HH:MM almoço início
  lunchEnd: string;              // HH:MM almoço fim
}
```

### Service (Serviço)
```typescript
{
  id: string;                    // ID único
  name: string;                  // Nome do serviço
  price: number;                 // Valor em reais
  duration: number;              // Duração em minutos
  image: string;                 // URL da imagem
}
```

---

## 🔐 Segurança

- ✅ Senhas do barbeiro armazenadas no Supabase Auth
- ✅ Token de sessão em sessionStorage
- ✅ Validação de entrada em todos os formulários
- ✅ Base64 para comprovantes (sem upload a servidor)

---

## 📱 Responsividade

O sistema é totalmente responsivo:
- ✅ Mobile (< 640px)
- ✅ Tablet (640px - 1024px)
- ✅ Desktop (> 1024px)

---

## 🎓 Documentação Técnica

Veja `CORRECTIONS.md` para:
- Lista completa de bugs corrigidos
- Mudanças por arquivo
- Novos componentes
- Fluxo de confirmação sincronizado

---

**Versão**: 1.0.0
**Última atualização**: 2026-05-28
**Status**: ✅ Pronto para uso
