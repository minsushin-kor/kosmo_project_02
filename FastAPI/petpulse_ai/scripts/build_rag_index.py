"""
RAG 인덱스 구축 스크립트
========================
vet_knowledge_corpus.json의 45개 수의학 문서를 임베딩하여
ChromaDB에 저장합니다. FastAPI 서버 실행 전에 단 한 번만 실행하면 됩니다.

실행 방법 (petpulse_ai/ 폴더에서):
    python scripts/build_rag_index.py

결과:
    app/data/chroma_db/ 폴더에 벡터 인덱스 저장
    이후 서버 시작 시 자동으로 로드됨
"""

import os
import json
import sys

# =====================================================================
# 의존성 확인
# =====================================================================
try:
    import chromadb
except ImportError:
    print("[오류] chromadb가 설치되지 않았습니다.")
    print("  → pip install chromadb 실행 후 다시 시도하세요.")
    sys.exit(1)

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("[오류] sentence-transformers가 설치되지 않았습니다.")
    print("  → pip install sentence-transformers 실행 후 다시 시도하세요.")
    sys.exit(1)


# =====================================================================
# 설정
# =====================================================================
CORPUS_PATH   = "app/data/vet_knowledge_corpus.json"
CHROMA_PATH   = "app/data/chroma_db"
COLLECTION    = "vet_knowledge"

# 다국어(한국어 포함) 지원 경량 임베딩 모델 (약 50MB, 무료)
# 한국어 성능이 더 필요하다면 "jhgan/ko-sroberta-multitask" (400MB)로 교체 가능
EMBED_MODEL   = "paraphrase-multilingual-MiniLM-L12-v2"


def build_rag_index():
    # 1. 말뭉치(corpus) 파일 로드
    if not os.path.exists(CORPUS_PATH):
        print(f"[오류] 말뭉치 파일이 없습니다: {CORPUS_PATH}")
        sys.exit(1)

    with open(CORPUS_PATH, "r", encoding="utf-8") as f:
        corpus = json.load(f)
    print(f"[로드] 수의학 말뭉치: {len(corpus)}개 문서")

    # 2. 임베딩 모델 초기화 (최초 실행 시 모델 다운로드, 약 50MB)
    print(f"[임베딩] 모델 로드 중: {EMBED_MODEL}")
    print("  ※ 최초 실행 시 모델 다운로드가 발생합니다 (약 50MB, 수 분 소요)")
    model = SentenceTransformer(EMBED_MODEL)
    print("[임베딩] 모델 로드 완료")

    # 3. ChromaDB 클라이언트 초기화 (영구 저장)
    os.makedirs(CHROMA_PATH, exist_ok=True)
    client = chromadb.PersistentClient(path=CHROMA_PATH)

    # 기존 컬렉션 삭제 후 재생성 (재실행 시 중복 방지)
    try:
        client.delete_collection(COLLECTION)
        print(f"[초기화] 기존 컬렉션 '{COLLECTION}' 삭제 완료")
    except Exception:
        pass

    collection = client.create_collection(
        name=COLLECTION,
        metadata={"hnsw:space": "cosine"}   # 코사인 유사도 사용
    )

    # 4. 문서 임베딩 및 ChromaDB 저장
    print(f"[임베딩] {len(corpus)}개 문서 벡터화 중...")
    texts     = [item["content"]  for item in corpus]
    ids       = [item["id"]       for item in corpus]
    metadatas = [
        {"category": item["category"], "title": item["title"]}
        for item in corpus
    ]

    # 배치 임베딩 (전체 한 번에)
    embeddings = model.encode(texts, show_progress_bar=True).tolist()

    collection.add(
        embeddings=embeddings,
        documents=texts,
        ids=ids,
        metadatas=metadatas
    )

    # 5. 검증 및 완료 메시지
    count = collection.count()
    print(f"\n[완료] RAG 인덱스 구축 성공!")
    print(f"  - 저장 경로 : {CHROMA_PATH}")
    print(f"  - 컬렉션명  : {COLLECTION}")
    print(f"  - 총 문서 수: {count}개")
    print(f"\n이제 uvicorn으로 서버를 실행하면 RAG가 자동으로 활성화됩니다.")

    # 6. 간단한 검색 테스트
    print("\n[테스트] 샘플 쿼리 검색: '강아지 체온이 높고 구토해요'")
    test_embedding = model.encode(["강아지 체온이 높고 구토해요"]).tolist()
    results = collection.query(
        query_embeddings=test_embedding,
        n_results=3,
        include=["documents", "metadatas", "distances"]
    )
    for i, (doc, meta, dist) in enumerate(zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0]
    )):
        print(f"  Top{i+1} [{meta['category']}] {meta['title']} (거리: {dist:.4f})")
        print(f"         {doc[:60]}...")


if __name__ == "__main__":
    build_rag_index()
