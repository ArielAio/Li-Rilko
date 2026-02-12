# Roadmap de Melhorias UI/UX Android

## Objetivo
Garantir consistencia visual, motion coerente com Material 3 e experiencia fluida no mobile (publico principal Android), mantendo performance e acessibilidade.

## Etapas
1. Baseline tecnico e criterios de aceite
Status: concluido
- Build de producao validado com `npm run build`.
- Auditoria de dependencias sem vulnerabilidades com `npm audit --omit=dev`.
- Fluxo principal mapeado: Home -> Catalogo -> Produto -> Carrinho -> WhatsApp.

2. Sistema tipografico unico
Status: concluido
- Tokens tipograficos criados no `:root` (display/headline/title/body/label).
- Tamanhos e pesos harmonizados nas principais secoes publicas e admin.

3. Harmonizacao de fontes
Status: concluido
- `next/font` ajustado para uso variable + `display: swap`.
- Uso da fonte display reduzido para titulos estrategicos.
- Texto operacional, admin e feedbacks priorizando fonte de leitura.

4. Motion tokenizado
Status: concluido
- Tokens de duracao e easing centralizados no `:root`.
- Transicoes migradas para tokens, removendo valores isolados de `ease`.

5. Transicoes contextuais de jornada
Status: concluido
- Catalogo: troca de filtro com `fade-through`.
- Produto: `viewTransitionName` para midia e titulo (progressive enhancement).
- Navegacao interna principal com `TransitionLink` usando View Transitions API quando suportado.

6. Acessibilidade de movimento
Status: concluido
- `prefers-reduced-motion` ampliado para todo o sistema (nao apenas toast).
- Animacoes e transicoes reduzidas para usuarios sensiveis a movimento.

7. QA final e estabilidade
Status: concluido
- Build final sem erros.
- Revisao de pontos de risco: carrinho hidratacao, links internos, feedbacks e modal admin.

## Criterios de release
- Build de producao verde.
- Sem erros de runtime nas rotas principais.
- Navegacao mobile sem bloqueio de interacao.
- Feedback visual consistente sem excesso de ruido.

## Referencias tecnicas usadas
- Material motion: [Duration & easing](https://m1.material.io/motion/duration-easing.html)
- Material motion: [Movement principles](https://m1.material.io/motion/movement.html)
- Android M3 typography: [Material 3 typography setup](https://developer.android.com/develop/ui/compose/designsystems/material3#typography)
- Next.js fonts: [How to optimize fonts](https://nextjs.org/docs/app/getting-started/fonts)
- Web font performance: [Optimize webfont loading](https://web.dev/articles/optimize-webfont-loading)
- Variable fonts performance: [Introduction to variable fonts](https://web.dev/articles/variable-fonts)
