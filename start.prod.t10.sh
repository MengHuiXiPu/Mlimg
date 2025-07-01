echo " build code "
imageTag="V1.6.1.20240325Alpha.1.0.prod.t10"
#git fetch
#git pull
echo "build code"
rm -rf dist
npm install
npm run build:t10
cp -rf docker/* ./
docker login 10.120.200.35:8089
docker build -t 10.120.200.35:8089/ts/front:$imageTag  -f Dockerfile --no-cache .
docker push 10.120.200.35:8089/ts/front:$imageTag
pwd
sed -i "/spec:/,/image:/ s|image:.*|image: 10.120.200.35:8089/ts/front:$imageTag|g" tcl-front.prod.yaml

cat tcl-front.prod.yaml
