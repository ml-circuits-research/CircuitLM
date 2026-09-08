# Pin this base to an approved digest for production/reproducible deployment.
FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node package.json cli.mjs ./
COPY --chown=node:node src ./src
COPY --chown=node:node sop ./sop
COPY --chown=node:node examples ./examples
USER node
EXPOSE 8000
ENTRYPOINT ["node", "cli.mjs"]
CMD ["serve", "--host", "0.0.0.0", "--port", "8000"]
