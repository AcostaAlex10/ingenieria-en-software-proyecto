# Backend PHP (SGSO) sobre Apache. Imagen pensada para Render (modo Docker)
# u cualquier hosting que corra contenedores. Apache es multi-hilo, asi que
# no tiene el bloqueo del servidor de desarrollo "php -S".

FROM php:8.3-apache

# Extension para conectarse a MariaDB / MySQL (PDO).
RUN docker-php-ext-install pdo_mysql

# Habilitar reescritura de URLs (la usa public/.htaccess para enrutar a index.php)
# y dejar la raiz del sitio en la carpeta public/.
RUN a2enmod rewrite \
 && sed -ri 's!DocumentRoot /var/www/html!DocumentRoot /var/www/html/public!' /etc/apache2/sites-available/000-default.conf \
 && printf '<Directory /var/www/html/public>\n    AllowOverride All\n    Require all granted\n</Directory>\n' > /etc/apache2/conf-available/sgso.conf \
 && a2enconf sgso

# Copiar el codigo del backend (el contexto de build es la carpeta back/).
COPY . /var/www/html/

# Render (y otros) inyectan el puerto en la variable $PORT. Apache debe
# escuchar en ese puerto. Lo ajustamos al arrancar.
RUN printf '#!/bin/sh\nset -e\nP="${PORT:-80}"\nsed -ri "s/^Listen .*/Listen ${P}/" /etc/apache2/ports.conf\nsed -ri "s/<VirtualHost \\*:[0-9]+>/<VirtualHost *:${P}>/" /etc/apache2/sites-available/000-default.conf\nexec apache2-foreground\n' > /usr/local/bin/start.sh \
 && chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
