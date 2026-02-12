# Dúvidas Pendentes — Projeto Li Rilko

Objetivo deste arquivo: centralizar tudo que ainda está em aberto para lapidar o sistema antes da implementação.

## 1) Decisões Comerciais e Operacionais
- [ ] Qual é o número oficial de WhatsApp para receber pedidos? (formato com DDI/DDD)
- [ ] Qual data final exata de entrega da v1? (dia/mês/ano)
- [ ] Qual será o domínio oficial no lançamento?
- [ ] Quem será responsável por aprovar conteúdo final (textos, banners, categorias)?

## 2) Catálogo e Estrutura de Produtos
- [ ] Lista final de categorias e subcategorias da v1 (sabendo que pode mudar depois)
- [ ] Quantos produtos entram na carga inicial?
- [ ] Como os produtos serão enviados inicialmente? (planilha, painel, outro)
- [ ] Produto sem estoque: mostrar “Esgotado” ou ocultar da vitrine?
- [ ] Produto pode ter mais de 1 imagem por padrão? (mínimo e ideal)
- [ ] Haverá variações por produto? (ex.: tamanho, volume, cor, kit)
- [ ] Como tratar desconto: preço “de/por”, desconto por quantidade, ambos?

## 3) Busca, Filtros e Navegação
- [ ] Filtros da v1 além de categoria/subcategoria (ex.: faixa de preço, marca, disponibilidade)
- [ ] Busca vai considerar apenas nome mesmo, ou também descrição/tags?
- [ ] Ordem padrão da listagem (mais vendidos, mais novos, menor preço, manual)

## 4) Checkout via WhatsApp
- [ ] Confirmar número final do WhatsApp (ponto crítico do fluxo)
- [ ] Confirmar se a mensagem vai incluir:
  - [ ] Nome + quantidade + preço por item
  - [ ] Total final
  - [ ] Frase final já definida
- [ ] Frase inicial pode ficar fixa para todos os pedidos ou precisa ser editável no painel?

## 5) Contato e Institucional
- [ ] Quais contatos serão exibidos no site:
  - [ ] WhatsApp
  - [ ] Instagram
  - [ ] Endereço
  - [ ] E-mail
- [ ] Endereço completo será exibido publicamente ou apenas cidade/estado?

## 6) Design e Marca
- [ ] Confirmar se haverá tela de confirmação de idade (+18)
- [ ] Cor vermelha oficial da marca (hex) para manter padronização
- [ ] Logo em versão com fundo transparente (PNG/SVG) para uso no header/footer
- [ ] Referência visual aprovada: manter estilo “comercial forte” com base clara e blocos escuros?
- [ ] Existe alguma restrição visual do cliente? (ex.: evitar certas cores, estilos, animações)

## 7) Painel/Admin e Manutenção
- [ ] Quem terá acesso de admin no início? (e-mails/usuários)
- [ ] Nível de permissão: todos podem editar tudo ou haverá perfis (admin/operador)?
- [ ] Quem fará manutenção após entrega (cliente/equipe) e com qual frequência?
- [ ] Necessita treinamento rápido gravado ou manual de uso?

## 8) Infra e Limites (Estratégia Free-First)
- [ ] Confirmar estratégia inicial 100% free (Vercel + Supabase) até crescimento real
- [ ] Definir gatilho de upgrade (ex.: atingir 80-85% da cota mensal por 2 meses)
- [ ] Confirmar padrão de imagens de upload (resolução máxima e peso por arquivo)

## 9) Itens já definidos até agora (para referência)
- Plataforma: Next.js
- Sem checkout/pagamento no site
- Carrinho com ajuste de quantidade
- Finalização via WhatsApp com mensagem pronta
- Exibir total no resumo do WhatsApp
- Busca por nome como padrão
- Sem seção “formas de pagamento aceitas”
- Implementação inicial por você; manutenção futura pelo cliente/equipe
