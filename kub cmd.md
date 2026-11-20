kubectl version


kubectl cluster-info ->to check whether the cluster is running or not 


kubectl create deployment ngnix --image=ngnix


kubectl get replicasets 

kubectl get pods 


kubectl get deployment 


kubectl expose deployment ngnix --type=NodePort --port=80


kubectl get services


kubectl port-forward service/ngnix 8080:80

open the http://localhost:8080 