1. What is Kubernetes?
Basic definition for viva
Kubernetes (K8s) is an open-source container orchestration platform used to deploy, manage, scale, and monitor containerized applications.

Let's understand what container orchestration means.
Suppose you developed an e-commerce application
Your application has:
- Frontend container (React)
- Backend container (Node.js)
- Database container (MongoDB)
Initially, your application has 100 users. Everything works fine.

But suddenly, your application becomes popular, and 10,000 users start accessing it.

Now some problems can occur:
1. Your backend container might receive too many requests.
2. One container might crash.
3. Your application might become slow.
4. You may need additional containers to handle traffic.
5. If a container fails, someone needs to restart it.
Managing all these containers manually becomes difficult.

This is where Kubernetes comes into the picture.

Kubernetes automatically helps with:
- Container deployment.
- Scaling applications up and down.
- Restarting failed containers.
- Load balancing traffic.
- Managing application availability.
- Updating applications.






Bro! Now you're getting it. ❤️ Your understanding is almost correct. Just a few small corrections.

Let's check each concept.

## **1. Cluster**

Your understanding is correct.

**Cluster is a group of connected physical or virtual machines (Nodes) that work together to run and manage containerized applications.**

One Cluster can contain multiple Nodes.

## **2. Types of Nodes**

There are two main roles:

**A. Master Node (now officially called Control Plane Node)**

It manages and controls the entire Kubernetes Cluster.

Its responsibilities include:

- Managing the cluster.
- Deciding where Pods should run.
- Maintaining the desired state.
- Monitoring the cluster.

**B. Worker Node**

It is responsible for running application workloads.

It contains:

- Pods.
- Kubelet.
- Kube-proxy (or equivalent networking implementation).
- Container Runtime.

## **3. What is a Pod?**

Your understanding is correct!

**A Pod is the smallest deployable unit in Kubernetes that contains one or more containers.**

For example:

- Pod 1 → React container.
- Pod 2 → Node.js container.
- Pod 3 → MongoDB container.

## **4. Understand the complete structure**

**Kubernetes Cluster**

**Control Plane Node**

Management

API Server

Scheduler

Controller Manager

etcd

**Worker Node**

Runs apps

Pod 1 → Container

Pod 2 → Container

## **5. One small correction**

You said the Master Node handles traffic.

More precisely:

- Control Plane manages the cluster and makes scheduling decisions.
- Services and networking components handle application traffic.
- Worker Nodes run the application Pods.

Also, not every Kubernetes Cluster needs a dedicated physical Master Node; the Control Plane can run on virtual machines too.

## **6. Remember this for your viva**

| Term               | Definition                             |
| ------------------ | -------------------------------------- |
| Cluster            | Group of connected machines            |
| Node               | Individual physical or virtual machine |
| Control Plane Node | Manages the Cluster                    |
| Worker Node        | Runs application workloads             |
| Pod                | Smallest deployable Kubernetes unit    |
| Container          | Runs the actual application            |

**You're now clear on the foundation:**

Cluster → Nodes → Pods → Containers.

Next, understand Deployment and Service. They explain how Kubernetes maintains multiple Pods and allows users to access your applications.