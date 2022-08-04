# S3Proxy Dockerfile as base image
FROM docker.io/andrewgaul/s3proxy:sha-71541ac

# Copy vendor static files to image - need to mount these to nginx container through
# shared volume. This is required so that static files are available in a protected-b
# environment where network access is restricted.
COPY manifests/s3proxy/fancy/aws-js-s3-explorer/index.html /etc/static/aaw-fc/index.html
COPY manifests/s3proxy/fancy/aws-js-s3-explorer/explorer.css /etc/static/aaw-fc/explorer.css
COPY manifests/s3proxy/fancy/aws-js-s3-explorer/explorer.js /etc/static/aaw-fc/explorer.js
COPY manifests/s3proxy/fancy/aws-js-s3-explorer/sw_modify_headers.js /etc/static/aaw-fc/sw_modify_headers.js
COPY manifests/s3proxy/fancy/aws-js-s3-explorer/vendor/fonts/ /etc/static/fonts/
COPY manifests/s3proxy/fancy/aws-js-s3-explorer/vendor/webfonts/ /etc/static/vendor/webfonts/
COPY manifests/s3proxy/fancy/aws-js-s3-explorer/vendor/js/ /etc/static/vendor/js/
COPY manifests/s3proxy/fancy/aws-js-s3-explorer/vendor/css/ /etc/static/vendor/css/

# Create non-root user
ARG USER=jovyan
ARG APP_HOME=/home/jovyan/buckets

# Prepare relevant directories - need to create relevant directories first,
# create a new user called jovyan, change the permissions of the home directory
# of jovyan to allow read/write/execute, and change the owner of $APP_HOME to jovyan.
# this will let jovyan (non-root user) perform necessary s3proxy operations at the
# mount point /home/jovyan/buckets.
RUN mkdir -p $APP_HOME  && mkdir /home/jovyan/buckets/standard && mkdir /home/jovyan/buckets/premium

RUN adduser --system --group $USER \
    && mkdir -p $APP_HOME \
    && chmod -R 777 $APP_HOME \ 
    && chown -R $USER:$USER $APP_HOME

# Start container as non-root user
USER $USER

EXPOSE 80
ENTRYPOINT ["/opt/s3proxy/run-docker-container.sh"]