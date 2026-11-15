# Como trabalhamos

## O desenvolvimento é 100% feito por IA

- É esperado que um integrante (ou agente) produza muito, mas na direção errada. O papel de quem revisa é pegar esse trabalho e colocá-lo na direção certa.
- **Decisões já tomadas não são fonte de verdade.** Código, faixas, mapeamentos e docs existentes não são necessariamente corretos nem bons para o projeto. Questione, critique e mude quando fizer sentido.
- **Não existe "não pode quebrar a demo".** Refazer é barato; preservar algo ruim por medo de quebrar não é motivo válido.

## Fonte de verdade: o direcionamento atual

- [`docs/direcionamento.md`](docs/direcionamento.md) é o direcionamento atual do projeto. Ele, e não o código existente, define para onde o projeto vai.
- **Antes de fazer qualquer mudança, atualize `docs/direcionamento.md`** para refletir a decisão. Só depois mude código, faixas ou outros docs.
- Os demais documentos em `docs/` (recursos do desafio, análise estratégica, projetos anteriores) são contexto e pesquisa, não decisões.

## Estado e divisão do trabalho

- [`STATUS.md`](STATUS.md) diz o que já foi feito, item a item do direcionamento, e qual frente (A, B ou C) cuida de cada coisa e de quais arquivos.
- Leia antes de começar; não mexa em arquivos de outra frente sem avisar o dono.
- **Ao terminar um item, atualize o `STATUS.md` no mesmo commit.**
- Trabalhamos direto na `main`, sem branches nem PRs: `git pull` antes de começar e antes de cada push.
