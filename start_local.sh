echo " pull code "
git fetch
git pull
echo "build code"
npm run build
cp -rf docker/* ./
mv nginx.conf.local nginx.conf
docker login 10.120.200.35:8089
docker build -t 10.120.200.35:8089/ts/front:2.0.2 -f Dockerfile --no-cache .
docker push  10.120.200.35:8089/ts/front:2.0.2
docker rm -f tcl-front
docker run -d -p 8008:8008  -v /mnt/sda/data:/data  -v /mnt/sda/nas:/nas  --name tcl-front  10.120.200.35:8089/ts/front:2.0.2
echo "is run"

