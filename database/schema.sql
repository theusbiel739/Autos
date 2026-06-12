SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS tipos_usuario (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	nome VARCHAR(30) NOT NULL,
	descricao VARCHAR(150) NULL,
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uk_tipos_usuario_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	tipo_usuario_id INT UNSIGNED NOT NULL,
	nome_exibicao VARCHAR(80) NOT NULL,
	email VARCHAR(255) NOT NULL,
	senha_hash VARCHAR(255) NOT NULL,
	maior_18 BOOLEAN NOT NULL DEFAULT FALSE,
	status ENUM('ativo','bloqueado','inativo') NOT NULL DEFAULT 'ativo',
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uk_usuarios_email (email),
	KEY idx_usuarios_tipo_usuario_id (tipo_usuario_id),
	KEY idx_usuarios_status (status),
	CONSTRAINT fk_usuarios_tipo_usuario
		FOREIGN KEY (tipo_usuario_id) REFERENCES tipos_usuario (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS perfis (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	usuario_id BIGINT UNSIGNED NOT NULL,
	bio VARCHAR(200) NULL,
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uk_perfis_usuario_id (usuario_id),
	CONSTRAINT fk_perfis_usuario
		FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessoes (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	usuario_id BIGINT UNSIGNED NOT NULL,
	token_hash VARCHAR(255) NOT NULL,
	expira_em DATETIME NOT NULL,
	revogada_em DATETIME NULL,
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uk_sessoes_token_hash (token_hash),
	KEY idx_sessoes_usuario_id (usuario_id),
	KEY idx_sessoes_expira_em (expira_em),
	CONSTRAINT fk_sessoes_usuario
		FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categorias_posts (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	nome VARCHAR(40) NOT NULL,
	descricao VARCHAR(150) NULL,
	status ENUM('ativa','inativa') NOT NULL DEFAULT 'ativa',
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uk_categorias_posts_nome (nome),
	KEY idx_categorias_posts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marcadores_posts (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	nome VARCHAR(60) NOT NULL,
	status ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uk_marcadores_posts_nome (nome),
	KEY idx_marcadores_posts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS posts (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	usuario_id BIGINT UNSIGNED NOT NULL,
	categoria_id INT UNSIGNED NOT NULL,
	marcador_id INT UNSIGNED NULL,
	conteudo VARCHAR(500) NOT NULL,
	status ENUM('publicado','removido','bloqueado','em_analise') NOT NULL DEFAULT 'publicado',
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	KEY idx_posts_usuario_id (usuario_id),
	KEY idx_posts_categoria_id (categoria_id),
	KEY idx_posts_marcador_id (marcador_id),
	KEY idx_posts_status_criado_em (status, criado_em),
	CONSTRAINT fk_posts_usuario
		FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT,
	CONSTRAINT fk_posts_categoria
		FOREIGN KEY (categoria_id) REFERENCES categorias_posts (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT,
	CONSTRAINT fk_posts_marcador
		FOREIGN KEY (marcador_id) REFERENCES marcadores_posts (id)
		ON UPDATE CASCADE
		ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comentarios (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	post_id BIGINT UNSIGNED NOT NULL,
	usuario_id BIGINT UNSIGNED NOT NULL,
	conteudo VARCHAR(300) NOT NULL,
	status ENUM('publicado','removido','bloqueado') NOT NULL DEFAULT 'publicado',
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	KEY idx_comentarios_post_id (post_id),
	KEY idx_comentarios_usuario_id (usuario_id),
	KEY idx_comentarios_status_criado_em (status, criado_em),
	CONSTRAINT fk_comentarios_post
		FOREIGN KEY (post_id) REFERENCES posts (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT,
	CONSTRAINT fk_comentarios_usuario
		FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS curtidas (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	usuario_id BIGINT UNSIGNED NOT NULL,
	post_id BIGINT UNSIGNED NOT NULL,
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE KEY uk_curtidas_usuario_post (usuario_id, post_id),
	KEY idx_curtidas_post_id (post_id),
	CONSTRAINT fk_curtidas_usuario
		FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT,
	CONSTRAINT fk_curtidas_post
		FOREIGN KEY (post_id) REFERENCES posts (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS palavras_bloqueadas (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	termo VARCHAR(80) NOT NULL,
	termo_normalizado VARCHAR(80) NOT NULL,
	status ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uk_palavras_bloqueadas_termo_normalizado (termo_normalizado),
	KEY idx_palavras_bloqueadas_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tipos_denuncia (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	nome VARCHAR(60) NOT NULL,
	descricao VARCHAR(150) NULL,
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uk_tipos_denuncia_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS denuncias_posts (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	denunciante_id BIGINT UNSIGNED NOT NULL,
	post_id BIGINT UNSIGNED NOT NULL,
	tipo_denuncia_id INT UNSIGNED NOT NULL,
	descricao VARCHAR(300) NULL,
	status ENUM('pendente','em_analise','resolvida','rejeitada') NOT NULL DEFAULT 'pendente',
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uk_denuncias_posts_denunciante_post (denunciante_id, post_id),
	KEY idx_denuncias_posts_post_id (post_id),
	KEY idx_denuncias_posts_tipo_denuncia_id (tipo_denuncia_id),
	KEY idx_denuncias_posts_status_criado_em (status, criado_em),
	CONSTRAINT fk_denuncias_posts_denunciante
		FOREIGN KEY (denunciante_id) REFERENCES usuarios (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT,
	CONSTRAINT fk_denuncias_posts_post
		FOREIGN KEY (post_id) REFERENCES posts (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT,
	CONSTRAINT fk_denuncias_posts_tipo
		FOREIGN KEY (tipo_denuncia_id) REFERENCES tipos_denuncia (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS denuncias_comentarios (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	denunciante_id BIGINT UNSIGNED NOT NULL,
	comentario_id BIGINT UNSIGNED NOT NULL,
	tipo_denuncia_id INT UNSIGNED NOT NULL,
	descricao VARCHAR(300) NULL,
	status ENUM('pendente','em_analise','resolvida','rejeitada') NOT NULL DEFAULT 'pendente',
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uk_denuncias_comentarios_denunciante_comentario (denunciante_id, comentario_id),
	KEY idx_denuncias_comentarios_comentario_id (comentario_id),
	KEY idx_denuncias_comentarios_tipo_denuncia_id (tipo_denuncia_id),
	KEY idx_denuncias_comentarios_status_criado_em (status, criado_em),
	CONSTRAINT fk_denuncias_comentarios_denunciante
		FOREIGN KEY (denunciante_id) REFERENCES usuarios (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT,
	CONSTRAINT fk_denuncias_comentarios_comentario
		FOREIGN KEY (comentario_id) REFERENCES comentarios (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT,
	CONSTRAINT fk_denuncias_comentarios_tipo
		FOREIGN KEY (tipo_denuncia_id) REFERENCES tipos_denuncia (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS logs_moderacao (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	moderador_id BIGINT UNSIGNED NULL,
	acao VARCHAR(80) NOT NULL,
	entidade_tipo VARCHAR(40) NOT NULL,
	entidade_id BIGINT UNSIGNED NOT NULL,
	observacao VARCHAR(300) NULL,
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	KEY idx_logs_moderacao_moderador_id (moderador_id),
	KEY idx_logs_moderacao_entidade (entidade_tipo, entidade_id),
	KEY idx_logs_moderacao_criado_em (criado_em),
	CONSTRAINT fk_logs_moderacao_moderador
		FOREIGN KEY (moderador_id) REFERENCES usuarios (id)
		ON UPDATE CASCADE
		ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fontes_noticias (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	nome VARCHAR(120) NOT NULL,
	url_site VARCHAR(255) NOT NULL,
	url_rss VARCHAR(255) NOT NULL,
	status ENUM('ativa','inativa') NOT NULL DEFAULT 'ativa',
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uk_fontes_noticias_url_rss (url_rss),
	KEY idx_fontes_noticias_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS noticias (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	fonte_id INT UNSIGNED NOT NULL,
	titulo VARCHAR(180) NOT NULL,
	resumo VARCHAR(300) NULL,
	url_original VARCHAR(500) NOT NULL,
	publicada_em DATETIME NULL,
	status ENUM('rascunho','publicada','oculta','removida') NOT NULL DEFAULT 'rascunho',
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uk_noticias_url_original (url_original),
	KEY idx_noticias_fonte_id (fonte_id),
	KEY idx_noticias_status_publicada_em (status, publicada_em),
	CONSTRAINT fk_noticias_fonte
		FOREIGN KEY (fonte_id) REFERENCES fontes_noticias (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categorias_conteudos (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	nome VARCHAR(80) NOT NULL,
	descricao VARCHAR(180) NULL,
	status ENUM('ativa','inativa') NOT NULL DEFAULT 'ativa',
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uk_categorias_conteudos_nome (nome),
	KEY idx_categorias_conteudos_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conteudos_educativos (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	categoria_id INT UNSIGNED NOT NULL,
	autor_id BIGINT UNSIGNED NULL,
	titulo VARCHAR(160) NOT NULL,
	slug VARCHAR(180) NOT NULL,
	resumo VARCHAR(300) NULL,
	corpo TEXT NOT NULL,
	status ENUM('rascunho','publicado','oculto','removido') NOT NULL DEFAULT 'rascunho',
	criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uk_conteudos_educativos_slug (slug),
	KEY idx_conteudos_educativos_categoria_id (categoria_id),
	KEY idx_conteudos_educativos_autor_id (autor_id),
	KEY idx_conteudos_educativos_status_criado_em (status, criado_em),
	CONSTRAINT fk_conteudos_educativos_categoria
		FOREIGN KEY (categoria_id) REFERENCES categorias_conteudos (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT,
	CONSTRAINT fk_conteudos_educativos_autor
		FOREIGN KEY (autor_id) REFERENCES usuarios (id)
		ON UPDATE CASCADE
		ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
