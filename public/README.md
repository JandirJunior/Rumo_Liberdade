# 🚀 Rumo à Liberdade - Gamificação Financeira

![Next.js](https://img.shields.io/badge/Next.js-Framework-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Typed-blue)
![Firebase](https://img.shields.io/badge/Firebase-Backend-orange)
![Status](https://img.shields.io/badge/Status-Em%20Evolução-green)
![Build](https://img.shields.io/badge/Build-Strict%20TypeScript-red)

---

## 🧠 Visão do Produto

O **Rumo à Liberdade** é uma plataforma de gestão financeira gamificada que transforma a vida financeira em uma jornada estilo RPG.

O sistema combina:

* 📊 Controle financeiro real
* 🎮 Gamificação (XP, níveis, quests, vilões)
* 🏰 Colaboração entre usuários (Reino)
* 🔁 Automação financeira (recorrência)

---

## 🎯 Objetivo

Criar um sistema que:

* Engaje o usuário continuamente
* Automatize tarefas financeiras
* Permita colaboração entre múltiplos usuários
* Evolua sem quebrar funcionalidades existentes

---

## 🛠️ Tech Stack

* **Framework:** Next.js
* **Linguagem:** TypeScript
* **Backend:** Firebase (Firestore + Auth)
* **Estilo:** Tailwind CSS (Dark Mode RPG)
* **Deploy:** Vercel

---

## 🎮 Funcionalidades

### 🔐 Base

* [x] Autenticação Firebase
* [x] Multiusuário (Reino)
* [x] Isolamento por `kingdom_id`

---

### 📊 Financeiro

* [x] Transações
* [x] Patrimônio líquido
* [x] Investimentos

---

### 💳 Gestão Financeira

* [x] Contas a pagar
* [x] Contas a receber
* [x] Cartões de crédito
* [x] Parcelamentos
* [x] Faturas automáticas

---

### 🔁 Recorrência

* [x] Contas automáticas (mensal, semanal, anual)
* [x] Geração automática de Quests

---

### 🎯 Quests

* [x] Contas viram missões
* [x] Top 10 mais próximas
* [x] Conclusão gera transação + XP

---

### 🎮 Gamificação

* [x] XP por ações
* [x] Níveis
* [x] Títulos RPG

---

### 🐉 Vilões

* [x] Baseados no patrimônio
* [x] Representam desafios financeiros

---

### 🏰 Reino (Multiusuário)

#### 👑 Roles

| Role   | Permissões            |
| ------ | --------------------- |
| Admin  | Controle total        |
| Member | Operações financeiras |
| Viewer | Somente leitura       |

---

## 🧩 Arquitetura

* `financialEngine` → cálculos financeiros
* `gameEngine` → XP e níveis
* `recurringTasks` → automação
* Hooks → integração com Firestore

---

## ⚠️ REGRAS IMPORTANTES (OBRIGATÓRIO SEGUIR)

🚨 **ESTAS REGRAS SÃO CRÍTICAS E NÃO PODEM SER VIOLADAS EM HIPÓTESE ALGUMA**

### ❗ NÃO FAZER

* ❌ NÃO remover funcionalidades existentes
* ❌ NÃO alterar drasticamente o motor financeiro
* ❌ NÃO duplicar cálculos financeiros
* ❌ NÃO criar lógica paralela para algo já existente

---

### ✅ SEMPRE FAZER

* ✔ Reutilizar módulos existentes
* ✔ Evoluir de forma incremental
* ✔ Manter compatibilidade com dados atuais
* ✔ Validar impacto antes de alterar qualquer código
* ✔ Sempre validar para não dar erros de TypeScript para evitar erros em Deploy no Vercel
* ✔ Sempre Alimentar README após a implementação de projetos ou manutenções de grande impacto


---

## 📊 Padrões de Dados

### Categorias

```ts
category_id ✅
category ❌ (PROIBIDO)
```

---

### Multiusuário

```ts
kingdom_id obrigatório em TODAS entidades
```

```ts
where("kingdom_id", "==", currentKingdomId)
```

---

## 🚨 Checklist Obrigatório (Google AI Studio)

ANTES de qualquer implementação, validar:

### 🔍 Estrutura

* [ ] Não está duplicando lógica existente
* [ ] Está reutilizando hooks existentes
* [ ] Está respeitando `financialEngine`
* [ ] Sempre validar para não dar erros de TypeScript para evitar erros em Deploy no Vercel
* [ ] Sempre Alimentar README após a implementação de projetos ou manutenções de grande impacto


---

### 🔐 Segurança

* [ ] Permissões por role implementadas
* [ ] Usuário validado antes de ações críticas

---

### 🏰 Multiusuário

* [ ] Todas queries filtram por `kingdom_id`
* [ ] Não há vazamento de dados

---

### 🔁 Recorrência

* [ ] Não gera duplicações
* [ ] Controle por período implementado

---

### ⚔️ Concorrência

* [ ] Evita ações duplicadas
* [ ] Valida estado antes de executar

---

### 💳 Cartões

* [ ] Parcelas corretas
* [ ] Fatura consistente

---

### 📜 Auditoria

* [ ] Logs de ações implementados

---

## 🚀 Deploy (Vercel)

### ⚠️ Regras CRÍTICAS para build

O projeto utiliza:

* TypeScript STRICT
* Next.js com SSR

---

### 🚨 IMPORTANTE

* Nunca ignorar erro de build
* Nunca usar `any` para "resolver rápido"
* Nunca quebrar tipagem existente

---

## 📈 Roadmap Técnico

### 🔴 Fase 1 (Atual)

* [ ] Permission Engine
* [ ] Activity Logs
* [ ] Validação global de `kingdom_id`

---

### 🟡 Fase 2

* [ ] Concorrência segura
* [ ] Melhorias em recorrência
* [ ] Ajustes de cartão/fatura

---

### 🟢 Fase 3

* [ ] Feed do Reino
* [ ] Ranking de usuários
* [ ] Cofres individuais

---

## 🚀 Status do Projeto

✔ Estrutura financeira sólida
✔ Gamificação integrada
✔ Multiusuário funcional
✔ Recorrência ativa
✔ Sistema escalável

---

## 💡 Filosofia

> "Evoluir sem quebrar o que já funciona."

---

## 📢 Diretriz Final

🚨 **Este README é a fonte oficial do projeto.**

Toda implementação deve:

* Ser incremental
* Ser segura
* Ser compatível
* Ser validada antes do deploy

---

## 👨‍💻 Autor

Desenvolvido por **Jandir Junior**
Focado em tecnologia, automação e liberdade financeira 🚀
