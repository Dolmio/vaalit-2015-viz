(ns infoviz.core)

(use '(incanter core datasets io stats))

(defn read-raw-data [filename]
  (->> (slurp filename :encoding "ISO-8859-1")
       (clojure.string/split-lines)
       (map #(clojure.string/split % #"\;"))
       )
  )
(def raw-2011-data (read-raw-data "HS-vaalikone2011.csv"))


(def raw-2015-data (read-raw-data "HS-vaalikone2015-18-02.csv"))

(def labels-2015 (first raw-2015-data))
(def data-2015 (rest raw-2015-data))
(def labels-2011 (first raw-2011-data))
(def data-2011 (rest raw-2011-data))

(defn normalize-2011-data-row [row]
  {:first-name (nth row 3)
   :last-name (nth row 2)
   :party (nth row 1)
   :raw-data row}
  )

(def normalized-2011-data (map normalize-2011-data-row data-2011))

(defn normalize-2015-data-row [row]
  (let [name (second row)
        name-splitted (clojure.string/split name #"\s")]
    {:first-name (first name-splitted)
     :last-name (clojure.string/join (rest name-splitted))
     :party (nth row 3)
     :raw-data row
     }
    ))

(def normalized-2015-data (map normalize-2015-data-row data-2015))


(defn select-name [map]
  (select-keys map [:first-name :last-name]))

(def names-found-in-both-data-sets
  (clojure.set/intersection
    (set (map select-name normalized-2015-data))
    (set (map select-name normalized-2011-data))
    ))

(defn get-only-rows-in-both [dataset]
  (filter (fn [row] (some #(= (select-name row) %) names-found-in-both-data-sets)) dataset)
  )

(def combined-data
  (let [only-in-both-2015 (get-only-rows-in-both normalized-2015-data)
        only-in-both-2011 (get-only-rows-in-both normalized-2011-data)]
    (map #(hash-map
           :first-name (:first-name %)
           :last-name (:last-name %)
           :2015 (:raw-data %)
           :2011 (:raw-data (first (filter (fn [row]
                                             (= (select-name row) (select-name %))) only-in-both-2011))))
      only-in-both-2015)))

(def obligatory-swedish-2015-index (.indexOf labels-2015 "q6"))
(def obligatory-swedish-2011-index 84)

(def obligatory-swedish-answer-options-2015
  (set (map #(nth % obligatory-swedish-2015-index) data-2015)))

(def gay-index-2011 19)

(def data (read-dataset "HS-vaalikone2015-18-02.csv" :header true :delim \;))
(def columns-to-group-by [:district :party :age :gender])
(def question-columns [:q1 :q2 :q3 :q4 :q5 :q6 :q7 :q8 :q9 :q10 :q11 :q12 :q13 :q14 :q15 :q16 :q17 :q18 :q19 :q20 :q21 :q22 :q23 :q24 :q25 :q26 :q27 :q28 :q29 :q30])

(defn column-order [group-by ]
  (concat [group-by] question-columns)
  )
(defn aggregate-group [sum-fn group-by]
  (let [agg (-> (reduce (fn [res cur]
            ($join [group-by group-by] ($rollup sum-fn cur group-by data) res)
            )
          ($rollup sum-fn (first question-columns) group-by data)
          (rest question-columns)
          )
       (reorder-columns (column-order group-by)))
       labels (map first (to-list (sel agg :cols [0])))
       questions (sel agg :except-cols [0])
       combined (apply hash-map (interleave labels (to-matrix questions)))
        ]
    (to-dataset combined)
    )



       )




(defn create-data-files []
  (doall
    (map #(save (aggregate-group variance %) (str "./" (name %) "-variance.csv")) columns-to-group-by))
  )