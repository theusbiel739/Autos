SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO tipos_usuario (nome, descricao) VALUES
	('Usuário', 'Pessoa cadastrada que poderá interagir na comunidade futuramente.'),
	('Moderador', 'Pessoa responsável por apoiar a moderação de conteúdos.'),
	('Administrador', 'Pessoa responsável pela administração da plataforma.')
ON DUPLICATE KEY UPDATE
	descricao = VALUES(descricao);

INSERT INTO categorias_posts (nome, descricao) VALUES
	('Dica', 'Sugestões práticas compartilhadas pela comunidade.'),
	('Experiência', 'Relatos pessoais e aprendizados vividos.'),
	('Pergunta', 'Dúvidas abertas para troca respeitosa.'),
	('Desabafo', 'Espaço de acolhimento para expressão pessoal.'),
	('Informação', 'Compartilhamento de informações úteis e responsáveis.')
ON DUPLICATE KEY UPDATE
	descricao = VALUES(descricao);

INSERT INTO marcadores_posts (nome) VALUES
	('Funcionou para mim'),
	('Estou buscando ajuda'),
	('Compartilhando informação')
ON DUPLICATE KEY UPDATE
	nome = VALUES(nome);

INSERT INTO tipos_denuncia (nome, descricao) VALUES
	('Spam', 'Conteúdo repetitivo, promocional ou sem relação com a comunidade.'),
	('Discurso ofensivo', 'Conteúdo com linguagem ofensiva ou desrespeitosa.'),
	('Informação perigosa', 'Conteúdo que pode induzir práticas inseguras.'),
	('Assédio', 'Conduta de perseguição, intimidação ou constrangimento.'),
	('Outro', 'Situação que precisa de análise da moderação.')
ON DUPLICATE KEY UPDATE
	descricao = VALUES(descricao);

INSERT INTO categorias_conteudos (nome, descricao) VALUES
	('O que é TEA', 'Conteúdos introdutórios sobre o Transtorno do Espectro Autista.'),
	('Diagnóstico', 'Informações gerais sobre avaliação e acompanhamento profissional.'),
	('Direitos', 'Conteúdos sobre direitos, garantias e caminhos de orientação.'),
	('Inclusão escolar', 'Materiais sobre ambiente escolar, adaptação e participação.'),
	('Inclusão no trabalho', 'Materiais sobre acessibilidade e inclusão profissional.'),
	('Materiais úteis', 'Guias, listas e recursos de apoio ao aprendizado.')
ON DUPLICATE KEY UPDATE
	descricao = VALUES(descricao);

INSERT INTO palavras_bloqueadas (termo, termo_normalizado) VALUES
	('termo demonstrativo um', 'termo demonstrativo um'),
	('termo demonstrativo dois', 'termo demonstrativo dois'),
	('termo demonstrativo tres', 'termo demonstrativo tres')
ON DUPLICATE KEY UPDATE
	termo = VALUES(termo);

-- Fontes reais de notícias por RSS devem ser cadastradas futuramente em fontes_noticias
-- somente após curadoria e validação editorial. Este seed não insere URLs RSS fictícias,
-- usuários, senhas, hashes, tokens, sessões, e-mails ou dados pessoais.
