# Use single run node build 's  dist; need npm run build front SourceCode generate  dist  folder is must！
#FROM 10.120.200.35:8089/ts/node:18.14 as build-stage
#
#WORKDIR /app
#
#COPY . .
## 删除现有的 dist 目录
#RUN rm -rf /app/dist
#RUN npm install -g cnpm --registry=https://registry.npmmirror.com
#RUN cnpm config set registry https://registry.npmmirror.com
#RUN cnpm config set fetch-retries 10
#RUN cnpm install process --save
#RUN cnpm install postcss@^8.0.0 autoprefixer@^10.0.0 postcss-preset-env@latest postcss-import@latest @vue/cli-service@latest  @vue/cli-plugin-babel@latest webpack@latest webpack-cli@4 --save-dev
#RUN rm -rf node_modules package-lock.json
#RUN cnpm install
#ENV NODE_OPTIONS=--openssl-legacy-provider
#RUN npm run build:stage


#FROM 10.120.200.35:8089/ts/nginx:alpine
FROM nginx:alpine

RUN rm /etc/nginx/nginx.conf

ADD nginx.conf /etc/nginx/


COPY run.sh /usr/local/bin/
RUN chmod 777 /usr/local/bin/run.sh
RUN rm -rf /usr/share/nginx/html/*
COPY dist/ /usr/share/nginx/html/
ENTRYPOINT ["sh", "/usr/local/bin/run.sh"]
