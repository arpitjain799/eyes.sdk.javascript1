ARG NODE_VERSION

FROM cypress/factory

# TODO - remove this when APPLITOOLS_API_KEY and move it ot exec
ARG APPLITOOLS_API_KEY
ENV APPLITOOLS_API_KEY=$APPLITOOLS_API_KEY

# Set the working directory to root
WORKDIR /app

# Copy the application files
COPY . .

# Set the working directory to eyes-cypress
WORKDIR /app/packages/eyes-cypress

RUN npx cypress@9 install; \
    npx cypress@latest install

# Run Cypress tests
CMD ["/bin/bash"]
