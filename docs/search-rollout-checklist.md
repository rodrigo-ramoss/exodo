# Search Rollout Checklist (Etapas 0 e 1)

## Etapa 0 - Seguranca operacional

- [x] Criar branch dedicada para a feature.
- [ ] Confirmar que Home, Selah, Mana, leitor e progresso continuam abrindo sem erro.
- [x] Rodar verificacao de tipos (`npx tsc --noEmit`) antes e depois das mudancas.
- [ ] Manter commits pequenos e reversiveis.
- [ ] Nao incluir arquivos nao relacionados no commit.

## Etapa 1 - Base tecnica da busca local (sem UI)

- [x] Criar indexador local para Selah e Mana.
- [x] Indexar titulo, serie, tema/subsecao e conteudo limpo.
- [x] Implementar relevancia (titulo > serie > metadados > conteudo).
- [x] Implementar extrato de contexto para resultado.
- [x] Garantir normalizacao sem acento para consulta (`pecado` ~= `pecados` parcial).
- [x] Expor API reutilizavel para etapas seguintes (UI Selah e Mana).

## Criterio de saida das etapas

- [ ] Nenhuma regressao no leitor/progresso atual.
- [x] Build de tipos sem erro.
- [x] Base de busca pronta para plugar na UI.
