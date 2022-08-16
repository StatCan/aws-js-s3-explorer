# S3Proxy Dockerfile as base image
FROM docker.io/andrewgaul/s3proxy:sha-ba0fd6d

# Copy vendor static files to image - need to mount these to nginx container through
# shared volume. This is required so that static files are available in a protected-b
# environment where network access is restricted.
COPY vendor/webfonts/ /etc/static/vendor/webfonts/
COPY vendor/fonts/ /etc/static/vendor/fonts/
COPY vendor/js/ /etc/static/vendor/js/
COPY vendor/css/ /etc/static/vendor/css/


COPY index.html /etc/static/index.html
COPY explorer.css /etc/static/explorer.css
COPY explorer.js /etc/static/explorer.js
COPY sw_modify_header.js /etc/static/sw_modify_header.js


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