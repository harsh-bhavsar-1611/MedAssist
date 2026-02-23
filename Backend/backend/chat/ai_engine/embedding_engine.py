# import json
# import numpy as np
# import faiss
# from sentence_transformers import SentenceTransformer

# model = SentenceTransformer("all-MiniLM-L6-v2")

# DATA_PATH = "chat/data/medical_data.json"


# def load_data():
#     with open(DATA_PATH, "r") as f:
#         return json.load(f)


# def combine_text(item):
#     symptoms = ", ".join(item["symptoms"])
#     return f"Symptoms: {symptoms}. Diagnosis: {item['possible_diagnosis']}. Advice: {item['advice']}"


# def build_index():
#     data = load_data()
#     texts = [combine_text(i) for i in data]
#     embeddings = model.encode(texts)

#     index = faiss.IndexFlatL2(embeddings.shape[1])
#     index.add(np.array(embeddings))

#     return index, data


# INDEX, MEDICAL_DATA = build_index()


# def search_medical(query, top_k=3):
#     query_vector = model.encode([query])
#     _, ids = INDEX.search(query_vector, top_k)
#     return [MEDICAL_DATA[i] for i in ids[0]]
