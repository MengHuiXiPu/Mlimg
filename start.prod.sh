echo " build code "
imageTag="1.6.0.prod.2023100902"
git fetch
git pull
echo "build code"
rm -rf dist
npm install
npm run build
cp -rf docker/* ./
docker login 10.120.200.35:8089
docker build -t 10.120.200.35:8089/ts/front:$imageTag  -f Dockerfile --no-cache .
docker push 10.120.200.35:8089/ts/front:$imageTag
pwd
sed -i "/spec:/,/image:/ s|image:.*|image: 10.120.200.35:8089/ts/front:$imageTag|g" tcl-front.prod.yaml

kubectl delete -f tcl-front.prod.yaml
kubectl apply -f tcl-front.prod.yaml
